import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  StartVisitProvider,
  useStartVisitData,
} from '../../../../modules/ayu/context/start-visit.context';
import type { VitalsFormValues } from '../../../../modules/ayu/types/vitals.types';
import type { VitalField } from '../../../../modules/ayu/types/vitals.types';
import type { PhysicalExamAnswers } from '../../../../modules/ayu/data/physical-exam.data';
import type { MedicalHistorySummary } from '../../../../modules/ayu/context/start-visit.context';
import type { AyuAnswerValue } from '../../../../modules/ayu/types/ayu.types';

// Helper component that renders context values
function ContextConsumer({
  onContext,
}: {
  onContext?: (ctx: ReturnType<typeof useStartVisitData>) => void;
}) {
  const ctx = useStartVisitData();
  onContext?.(ctx);
  return (
    <div>
      <span data-testid="patientUuid">{ctx.patientUuid ?? 'null'}</span>
      <span data-testid="vitals">{ctx.data.vitals ? 'set' : 'null'}</span>
      <span data-testid="visitReason">{ctx.data.visitReason ? 'set' : 'null'}</span>
      <span data-testid="physicalExam">{ctx.data.physicalExam ? 'set' : 'null'}</span>
      <span data-testid="medicalHistory">{ctx.data.medicalHistory ? 'set' : 'null'}</span>
    </div>
  );
}

// Helper component that triggers context setters via buttons
function ContextUpdater() {
  const ctx = useStartVisitData();
  return (
    <div>
      <span data-testid="patientUuid">{ctx.patientUuid ?? 'null'}</span>
      <span data-testid="vitals">{JSON.stringify(ctx.data.vitals)}</span>
      <span data-testid="visitReason">{JSON.stringify(ctx.data.visitReason)}</span>
      <span data-testid="physicalExam">{JSON.stringify(ctx.data.physicalExam)}</span>
      <span data-testid="medicalHistory">{JSON.stringify(ctx.data.medicalHistory)}</span>

      <button
        data-testid="btn-setPatientUuid"
        onClick={() => ctx.setPatientUuid('new-uuid-123')}
      />
      <button
        data-testid="btn-setVitals"
        onClick={() => {
          const formValues: VitalsFormValues = { height_cm: 170, weight_kg: 70 };
          const config: VitalField[] = [
            { name: 'Height', key: 'height_cm', uuid: 'uuid-h', is_mandatory: true, lang: null, is_enabled: true },
            { name: 'Weight', key: 'weight_kg', uuid: 'uuid-w', is_mandatory: true, lang: null, is_enabled: true },
          ];
          ctx.setVitalsData(formValues, config);
        }}
      />
      <button
        data-testid="btn-setVisitReason"
        onClick={() => {
          const answers: Record<string, AyuAnswerValue> = { q1: 'yes' };
          const reasonNames = ['Cough', 'Fever'];
          const details = [{ label: 'Duration', value: '3 days' }];
          ctx.setVisitReasonData(answers, reasonNames, details);
        }}
      />
      <button
        data-testid="btn-setPhysicalExam"
        onClick={() => {
          const answers: PhysicalExamAnswers = { eyes_jaundice: ['no_jaundice'] };
          ctx.setPhysicalExamData(answers);
        }}
      />
      <button
        data-testid="btn-setMedicalHistory"
        onClick={() => {
          const patHistSummary: MedicalHistorySummary[] = [
            { title: 'Past History', items: [{ type: 'labelValue', label: 'Diabetes', value: 'Yes' }] },
          ];
          const famHistSummary: MedicalHistorySummary[] = [
            { title: 'Family History', items: [{ type: 'labelValue', label: 'Hypertension', value: 'Father' }] },
          ];
          ctx.setMedicalHistoryData(patHistSummary, famHistSummary);
        }}
      />
    </div>
  );
}

describe('StartVisitProvider', () => {
  it('should render children', () => {
    render(
      <StartVisitProvider>
        <div data-testid="child">Hello</div>
      </StartVisitProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should set patientUuid when initialPatientUuid is provided', () => {
    render(
      <StartVisitProvider initialPatientUuid="patient-abc-123">
        <ContextConsumer />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('patientUuid')).toHaveTextContent('patient-abc-123');
  });

  it('should default patientUuid to null when no initialPatientUuid', () => {
    render(
      <StartVisitProvider>
        <ContextConsumer />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('patientUuid')).toHaveTextContent('null');
  });

  it('should default all data fields to null', () => {
    render(
      <StartVisitProvider>
        <ContextConsumer />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('vitals')).toHaveTextContent('null');
    expect(screen.getByTestId('visitReason')).toHaveTextContent('null');
    expect(screen.getByTestId('physicalExam')).toHaveTextContent('null');
    expect(screen.getByTestId('medicalHistory')).toHaveTextContent('null');
  });

  it('should update patientUuid via setPatientUuid', () => {
    render(
      <StartVisitProvider>
        <ContextUpdater />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('patientUuid')).toHaveTextContent('null');

    act(() => {
      screen.getByTestId('btn-setPatientUuid').click();
    });

    expect(screen.getByTestId('patientUuid')).toHaveTextContent('new-uuid-123');
  });

  it('should update vitals in data via setVitalsData', () => {
    render(
      <StartVisitProvider>
        <ContextUpdater />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('vitals')).toHaveTextContent('null');

    act(() => {
      screen.getByTestId('btn-setVitals').click();
    });

    const vitalsText = screen.getByTestId('vitals').textContent!;
    const vitals = JSON.parse(vitalsText);
    expect(vitals.formValues).toEqual({ height_cm: 170, weight_kg: 70 });
    expect(vitals.config).toHaveLength(2);
    expect(vitals.config[0].key).toBe('height_cm');
  });

  it('should update visitReason in data via setVisitReasonData', () => {
    render(
      <StartVisitProvider>
        <ContextUpdater />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('visitReason')).toHaveTextContent('null');

    act(() => {
      screen.getByTestId('btn-setVisitReason').click();
    });

    const visitReasonText = screen.getByTestId('visitReason').textContent!;
    const visitReason = JSON.parse(visitReasonText);
    expect(visitReason.answers).toEqual({ q1: 'yes' });
    expect(visitReason.reasonNames).toEqual(['Cough', 'Fever']);
    expect(visitReason.details).toEqual([{ label: 'Duration', value: '3 days' }]);
  });

  it('should update physicalExam in data via setPhysicalExamData', () => {
    render(
      <StartVisitProvider>
        <ContextUpdater />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('physicalExam')).toHaveTextContent('null');

    act(() => {
      screen.getByTestId('btn-setPhysicalExam').click();
    });

    const physicalExamText = screen.getByTestId('physicalExam').textContent!;
    const physicalExam = JSON.parse(physicalExamText);
    expect(physicalExam.answers).toEqual({ eyes_jaundice: ['no_jaundice'] });
  });

  it('should update medicalHistory in data via setMedicalHistoryData', () => {
    render(
      <StartVisitProvider>
        <ContextUpdater />
      </StartVisitProvider>
    );

    expect(screen.getByTestId('medicalHistory')).toHaveTextContent('null');

    act(() => {
      screen.getByTestId('btn-setMedicalHistory').click();
    });

    const medicalHistoryText = screen.getByTestId('medicalHistory').textContent!;
    const medicalHistory = JSON.parse(medicalHistoryText);
    expect(medicalHistory.patHistSummary).toHaveLength(1);
    expect(medicalHistory.patHistSummary[0].title).toBe('Past History');
    expect(medicalHistory.famHistSummary).toHaveLength(1);
    expect(medicalHistory.famHistSummary[0].title).toBe('Family History');
  });

  it('should preserve other data fields when updating one field', () => {
    render(
      <StartVisitProvider>
        <ContextUpdater />
      </StartVisitProvider>
    );

    // Set vitals first
    act(() => {
      screen.getByTestId('btn-setVitals').click();
    });

    expect(screen.getByTestId('vitals').textContent).not.toBe('null');

    // Set visit reason - vitals should still be set
    act(() => {
      screen.getByTestId('btn-setVisitReason').click();
    });

    expect(screen.getByTestId('vitals').textContent).not.toBe('null');
    expect(screen.getByTestId('visitReason').textContent).not.toBe('null');
  });
});

describe('useStartVisitData', () => {
  it('should throw when used outside StartVisitProvider', () => {
    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ContextConsumer />);
    }).toThrow('useStartVisitData must be used within StartVisitProvider');

    consoleSpy.mockRestore();
  });
});
