import { useEffect, useMemo, useState } from 'react';
import { evaluateEnableWhen } from '../../../../ayu-library/logic/enable-when.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../ayu-library/types/ayu.types';
import {
  FHIR_TYPE_CHOICE,
  FHIR_TYPE_STRING,
  SELECT_ANY_ONE,
  SELECT_ONE_OR_MORE,
} from '../../../../ayu-library/utils/constants';
import {
  collectDescendantLinkIds,
  findMatchingOptionCode,
  getRowLabel,
  isFieldLabelContainer,
} from '../../../../ayu-library/utils/question.utils';
import { AyuSelectableOption } from '../../common/ayu-selectable-option.component';
import '../../common/selectable-option.css';
import { AyuRenderer } from './ayu-renderer.component';

interface NestedProps {
  items?: AyuQuestion[];
  parentQuestion?: AyuQuestion;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
  clearAnswers?: (linkIds: string[]) => void;
  selectable?: boolean;
  /** When true, shows the triangle indicator for all item types including string/text inputs. */
  showAllTriangles?: boolean;
}

const FOLLOW_NEWEST = { kind: 'followNewest' } as const;
const ALL_COLLAPSED = { kind: 'allCollapsed' } as const;

/**
 * Sentinel used in `userChosenOption` to represent an explicit deselection by
 * the user.  A Symbol is unique and can never collide with a real linkId string,
 * so there is no ambiguity between "deselected" and a linkId that happens to
 * carry the same characters as a string constant would.
 */
const DESELECTED = Symbol('deselected');

type OpenBranch =
  | typeof FOLLOW_NEWEST
  | typeof ALL_COLLAPSED
  | { kind: 'branch'; label: string };

const getOptionDisplay = (
  question: AyuQuestion | undefined,
  code: string | undefined
): string | null => {
  if (!question || !code) return null;
  const option = question.answerOption?.find(
    opt => opt.valueCoding?.code === code || opt.valueString === code
  );
  return option?.valueCoding?.display || option?.valueString || null;
};

export const AyuNestedRenderer = ({
  items,
  parentQuestion,
  answers,
  setAnswer,
  clearAnswers,
  selectable = false,
  showAllTriangles = false,
}: NestedProps) => {
  const [userChosenOption, setUserChosenOption] = useState<
    string | null | typeof DESELECTED
  >(null);

  const [openBranch, setOpenBranch] = useState<OpenBranch>(FOLLOW_NEWEST);

  /* Reset selected option when the parent answer changes (different children become visible) */
  const parentAnswer = parentQuestion
    ? answers[parentQuestion.linkId]
    : undefined;
  useEffect(() => {
    setUserChosenOption(null);
    setOpenBranch(FOLLOW_NEWEST);
  }, [parentAnswer]);

  let selectedCodes: string[] = [];
  if (Array.isArray(parentAnswer)) {
    selectedCodes = parentAnswer;
  } else if (typeof parentAnswer === 'string') {
    selectedCodes = [parentAnswer];
  }

  const newestBranchLabel = getOptionDisplay(
    parentQuestion,
    selectedCodes.at(-1)
  );

  /* Clear answers for a selectable option and all its nested descendants */
  const clearNestedAnswers = (item: AyuQuestion) => {
    const linkIds = [item.linkId, ...collectDescendantLinkIds(item)].filter(
      id => answers[id] !== undefined
    );
    if (linkIds.length && clearAnswers) {
      clearAnswers(linkIds);
    }
  };

  /* Check if a choice question has answerOption → item mapping */
  const hasAnswerOptionItemMapping = (q: AyuQuestion) =>
    q.type === FHIR_TYPE_CHOICE && !!q.answerOption?.length && !!q.item?.length;

  /* Render deeply nested items inline when their corresponding option is selected */
  const renderInlineNestedItems = (parentChild: AyuQuestion) => {
    const parentAnswer = answers[parentChild.linkId];
    const selectedCodes: string[] = Array.isArray(parentAnswer)
      ? parentAnswer
      : typeof parentAnswer === 'string'
        ? [parentAnswer]
        : [];

    return parentChild
      .item!.filter(nestedItem => {
        const matchedCode = findMatchingOptionCode(nestedItem, parentChild);
        return matchedCode && selectedCodes.includes(matchedCode);
      })
      .map((nestedItem, idx, filtered) => (
        <div key={nestedItem.linkId} className="mt-2 ml-3">
          <AyuRenderer
            question={nestedItem}
            previousSibling={idx > 0 ? filtered[idx - 1] : undefined}
            value={answers[nestedItem.linkId]}
            onChange={val => setAnswer(nestedItem, val)}
            answers={answers}
            setAnswer={setAnswer}
          />
          {nestedItem.item && (
            <AyuNestedRenderer
              items={nestedItem.item}
              answers={answers}
              setAnswer={setAnswer}
              clearAnswers={clearAnswers}
              selectable={true}
            />
          )}
        </div>
      ));
  };

  /*
   * Build enriched answers so that sibling-gated items (enableWhen: operator "exists"
   * on a sibling) become visible as soon as that sibling is enabled, even before the
   * user enters a value.
   *
   * We iterate until stable (no entry added or removed) so that deep enableWhen
   * chains resolve correctly regardless of item order in the array (ASYNC-004).
   *
   * Entries for items whose enableWhen is no longer satisfied are deleted each
   * pass so stale real or synthetic values cannot keep downstream siblings visible
   * after a parent answer changes (FE-001).
   *
   * Memoized on [answers, items]: answers changes by reference on every user input
   * (triggering recompute as needed); items is the static questionnaire definition
   * and rarely changes. This avoids re-running the loop when only local state
   * (e.g. selectedOption) changes — such as when the user clicks a pill button.
   *
   * CYCLE GUARD: in a valid acyclic graph of n items at most n state changes can
   * occur, so convergence is guaranteed within n+1 passes. The cap at items.length+2
   * ensures the loop always terminates — contradictory or self-referential enableWhen
   * rules (invalid questionnaire data) cannot cause an infinite loop / frozen UI.
   * In practice convergence happens in 1–2 passes for typical questionnaire data.
   */
  const enrichedAnswers = useMemo<Record<string, AyuAnswerValue>>(() => {
    if (!items?.length) return {};
    const result: Record<string, AyuAnswerValue> = { ...answers };
    let changed = true;
    let passes = 0;
    const maxPasses = items.length + 2;
    while (changed && passes < maxPasses) {
      changed = false;
      passes++;
      for (const item of items) {
        const enabled = evaluateEnableWhen(item.enableWhen, result);
        if (!enabled && result[item.linkId] !== undefined) {
          delete result[item.linkId];
          changed = true;
          if (hasAnswerOptionItemMapping(item)) {
            for (const sub of item.item!) {
              if (result[sub.linkId] === true) {
                delete result[sub.linkId];
                changed = true;
              }
            }
          }
        } else if (enabled && result[item.linkId] === undefined) {
          result[item.linkId] = true;
          changed = true;
          if (hasAnswerOptionItemMapping(item)) {
            for (const sub of item.item!) {
              if (result[sub.linkId] === undefined) {
                result[sub.linkId] = true;
                changed = true;
              }
            }
          }
        }
      }
    }
    return result;
  }, [answers, items]);

  if (!items?.length) return null;

  const isEnabled = (item: AyuQuestion) =>
    evaluateEnableWhen(item.enableWhen, enrichedAnswers);

  /**
   * Strip the group label prefix from a child question's display text so that
   * a child labelled "Yes - When" renders as "When" when its group is "Yes".
   */
  const NESTED_SEPARATORS = [' - ', ' – ', ' — ', ': ', ' : '] as const;
  const stripGroupPrefix = (
    text: string | undefined,
    groupLabel: string | null
  ): string | undefined => {
    if (!groupLabel || !text) return text;
    for (const sep of NESTED_SEPARATORS) {
      if (text.startsWith(groupLabel + sep)) {
        return text.slice(groupLabel.length + sep.length).trim() || text;
      }
    }
    return text;
  };

  const labelRepeatsGroup = (
    child: AyuQuestion,
    groupLabel: string | null
  ): boolean =>
    !!groupLabel &&
    getRowLabel({
      ...child,
      text: stripGroupPrefix(child.text, groupLabel),
    }) === groupLabel;

  const getParentAnswerLabel = (item: AyuQuestion): string | null => {
    if (!item.enableWhen?.length || !parentQuestion) return null;

    const rule = item.enableWhen[0];

    const expected =
      rule.answerBoolean ??
      rule.answerString ??
      rule.answerInteger ??
      rule.answerCoding?.code;

    return getOptionDisplay(
      parentQuestion,
      typeof expected === 'string' ? expected : undefined
    );
  };

  const enabledItems = items.filter(isEnabled);
  if (!enabledItems.length) return null;

  // Group enabled items by their parent answer label
  const groups = new Map<string | null, AyuQuestion[]>();
  for (const item of enabledItems) {
    const label = getParentAnswerLabel(item);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  }

  const groupEntries = Array.from(groups.entries());
  const branchLabels = groupEntries
    .map(([label]) => label)
    .filter((label): label is string => label !== null);
  const isAccordion = branchLabels.length > 1;
  const defaultOpenLabel =
    newestBranchLabel && branchLabels.includes(newestBranchLabel)
      ? newestBranchLabel
      : branchLabels[0];
  let openLabel: string | null = null;
  if (openBranch.kind === 'followNewest') openLabel = defaultOpenLabel ?? null;
  else if (openBranch.kind === 'branch') openLabel = openBranch.label;

  return (
    <div className="space-y-4 px-3">
      {groupEntries.map(([label, children]) => {
        const collapsible = isAccordion && label !== null;
        const expanded = !collapsible || openLabel === label;
        /*
         * In selectable mode, flatten container items so their children appear
         * directly as pills instead of requiring an extra click on the container.
         * e.g. "Take the patient's BP lying down" → [Systolic, Diastolic]
         * Keep branching choice items intact (type=choice + answerOption + item)
         * because they need option-based reveal via renderInlineNestedItems.
         */
        const displayChildren = selectable
          ? children.flatMap(child => {
              if (!child.item?.length) return [child];
              if (hasAnswerOptionItemMapping(child)) return [child];
              /*
               * Replace the container with its children. Strip any enableWhen
               * that references the removed container so the children remain
               * visible (they are already gated by the container's own
               * enableWhen on the parent question).
               */
              return child.item.map(sub => {
                if (!sub.enableWhen?.some(ew => ew.question === child.linkId))
                  return sub;
                const kept = sub.enableWhen!.filter(
                  ew => ew.question !== child.linkId
                );
                return { ...sub, enableWhen: kept.length ? kept : undefined };
              });
            })
          : children.flatMap(child => {
              /*
               * In non-selectable (visit-reason) mode, bypass the intermediate
               * choice question that gates From/To/Event behind pill buttons.
               * Render all sub-items directly as labeled inputs by stripping
               * the enableWhen condition that references the removed container.
               */
              if (!isFieldLabelContainer(child)) return [child];
              return child.item!.map(sub => {
                const kept =
                  sub.enableWhen?.filter(ew => ew.question !== child.linkId) ??
                  [];
                return {
                  ...sub,
                  enableWhen: kept.length ? kept : undefined,
                };
              });
            });

        const selectedOption: string | null =
          userChosenOption === DESELECTED
            ? null
            : userChosenOption !== null
              ? userChosenOption
              : (displayChildren.find(
                  child => answers[child.linkId] !== undefined
                )?.linkId ?? null);

        return (
          <div key={label || 'default'}>
            {collapsible && (
              <button
                type="button"
                onClick={() =>
                  setOpenBranch(
                    expanded ? ALL_COLLAPSED : { kind: 'branch', label }
                  )
                }
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 py-2 text-left"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="#20c997"
                  className={`flex-shrink-0 transition-transform ${
                    expanded ? 'rotate-90' : ''
                  }`}
                >
                  <path d="M4 2 L14 8 L4 14 Z" />
                </svg>
                <span className="text-md font-medium text-black-500">
                  {label}
                </span>
              </button>
            )}
            <div style={expanded ? undefined : { display: 'none' }}>
              {selectable && displayChildren.length > 1 ? (
                <>
                  {/* Multiple children: render as selectable option pills */}
                  <p className="text-xs text-gray-500 mt-4 mb-1">
                    {parentQuestion?.repeats
                      ? SELECT_ONE_OR_MORE
                      : SELECT_ANY_ONE}
                  </p>
                  <div className="option-group mb-3">
                    {displayChildren.map(
                      item =>
                        !!item?.text && (
                          <AyuSelectableOption
                            key={item.linkId}
                            label={stripGroupPrefix(item.text, label)!}
                            value={item.linkId}
                            selected={selectedOption === item.linkId}
                            onClick={() => {
                              if (userChosenOption === item.linkId) {
                                /*
                                 * Deselecting current option — only clear for choice types
                                 * (input-type items like integer/string keep their entered value)
                                 */
                                if (item.type === FHIR_TYPE_CHOICE) {
                                  clearNestedAnswers(item);
                                }
                                setUserChosenOption(DESELECTED);
                              } else {
                                /* Switching to a new option — only clear previous for choice types */
                                if (
                                  userChosenOption &&
                                  userChosenOption !== DESELECTED
                                ) {
                                  const prevItem = displayChildren.find(
                                    c => c.linkId === userChosenOption
                                  );
                                  if (
                                    prevItem &&
                                    prevItem.type === FHIR_TYPE_CHOICE
                                  ) {
                                    clearNestedAnswers(prevItem);
                                  }
                                }
                                setUserChosenOption(item.linkId);
                              }
                            }}
                          />
                        )
                    )}
                  </div>

                  {/* Render input component for the selected item.
                   * Suppress the question text to avoid repeating the pill label. */}
                  {displayChildren
                    .filter(
                      child => !!child.text && selectedOption === child.linkId
                    )
                    .map(child => (
                      <div
                        key={child.linkId}
                        className="flex items-start gap-2 mt-2"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="#20c997"
                          className="flex-shrink-0 mt-4"
                        >
                          <path d="M4 2 L14 8 L4 14 Z" />
                        </svg>
                        <div className="flex-1">
                          <AyuRenderer
                            question={{ ...child, text: undefined }}
                            value={answers[child.linkId]}
                            onChange={val => setAnswer(child, val)}
                          />
                          {/* After flattening (lines 144-161), only
                            hasAnswerOptionItemMapping children retain
                            child.item — all others were replaced by their
                            grandchildren. So we only need the inline path. */}
                          {hasAnswerOptionItemMapping(child) &&
                            renderInlineNestedItems(child)}
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                /* Render all items directly via AyuRenderer */
                displayChildren.map((child, childIndex) => {
                  /*
                   * Show triangle for string items only when the group has multiple children
                   * (standalone question like "How often...?"), not when it's the sole child
                   * of an option (describe field like "Describe..." under a "Describe" option)
                   */
                  const isDescribeField =
                    child.type === FHIR_TYPE_STRING &&
                    displayChildren.length === 1;
                  const showTriangle = isDescribeField
                    ? false
                    : showAllTriangles ||
                      child.type !== FHIR_TYPE_STRING ||
                      displayChildren.length > 1;

                  const prevSibling =
                    childIndex > 0
                      ? displayChildren[childIndex - 1]
                      : undefined;

                  return (
                    <div
                      key={child.linkId}
                      className="flex items-start gap-2 mt-2"
                    >
                      {showTriangle && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="#20c997"
                          className="flex-shrink-0 mt-1"
                        >
                          <path d="M4 2 L14 8 L4 14 Z" />
                        </svg>
                      )}
                      <div className="flex-1">
                        <AyuRenderer
                          question={{
                            ...child,

                            text:
                              collapsible && labelRepeatsGroup(child, label)
                                ? undefined
                                : stripGroupPrefix(child.text, label),
                          }}
                          parent={parentQuestion}
                          previousSibling={prevSibling}
                          value={answers[child.linkId]}
                          onChange={val => setAnswer(child, val)}
                          answers={answers}
                          setAnswer={setAnswer}
                        />
                        {child.item &&
                          (hasAnswerOptionItemMapping(child) ? (
                            renderInlineNestedItems(child)
                          ) : (
                            <AyuNestedRenderer
                              items={child.item}
                              parentQuestion={child}
                              answers={answers}
                              setAnswer={setAnswer}
                              clearAnswers={clearAnswers}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
