import { createContext, useContext } from 'react';

/**
 * DOM node in the Start Visit header where a section can render its
 * Back / Next actions, so they share the row with "N/4 <section name>"
 * instead of taking a row of their own.
 *
 * Null until the header has mounted, and on any screen that renders a section
 * outside the Start Visit layout - consumers must fall back to rendering the
 * actions in place.
 */
export const HeaderActionsSlotContext = createContext<HTMLElement | null>(null);

export const useHeaderActionsSlot = () => useContext(HeaderActionsSlotContext);
