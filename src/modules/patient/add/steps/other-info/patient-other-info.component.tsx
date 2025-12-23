import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, type Resolver } from 'react-hook-form';
import type { InferType } from 'yup';
import { casteOptions } from '../../../../../assets/data/caste';
import { educationOptions } from '../../../../../assets/data/education';
import { economicStatusOptions } from '../../../../../assets/data/economic-status';
import { occupationOptions } from '../../../../../assets/data/occupation';
import { Button, Dropdown, Input } from '../../../../../components/common';
import { patientOtherInfoSchema } from './patient-other-info.validation';

type PatientOtherInfoFormValues = InferType<typeof patientOtherInfoSchema>;

interface PatientOtherInfoProps {
  defaultValues: PatientOtherInfoFormValues;
  onNext: (data: { otherInfo: PatientOtherInfoFormValues }) => void;
  onPrev: () => void;
}

export default function PatientOtherInfo({
  defaultValues,
  onNext,
  onPrev,
}: PatientOtherInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientOtherInfoFormValues>({
    resolver: yupResolver(
      patientOtherInfoSchema
    ) as Resolver<PatientOtherInfoFormValues>,
    mode: 'onTouched',
    defaultValues,
  });

  const handleNext = (data: PatientOtherInfoFormValues) => {
    onNext({ otherInfo: data });
  };

  return (
    <form onSubmit={handleSubmit(handleNext)} className="space-y-6 h-full">
      <div className="flex flex-col h-full">
        <div className="h-full flex flex-col gap-6 md:overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                {...register('sonDaughterWifeOf')}
                placeholder="Enter Son/Daughter/Wife Of"
                label="Enter Son/Daughter/Wife Of"
                error={errors.sonDaughterWifeOf?.message}
              />
            </div>
            <div>
              <Dropdown
                label="Occupation"
                placeholder="Select Occupation"
                options={occupationOptions}
                labelClassName="text-(--color-muted)"
                error={errors.occupation?.message}
                value={watch('occupation') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('occupation', selectedValue);
                }}
              />
            </div>
            <div>
              <Dropdown
                label="Caste"
                placeholder="Select Caste"
                options={casteOptions}
                labelClassName="text-(--color-muted)"
                error={errors.caste?.message}
                value={watch('caste') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('caste', selectedValue);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Dropdown
                label="Education"
                placeholder="Select Education"
                options={educationOptions}
                labelClassName="text-(--color-muted)"
                error={errors.education?.message}
                value={watch('education') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('education', selectedValue);
                }}
                isRequired={true}
              />
            </div>
            <div>
              <Dropdown
                label="Economic Status"
                placeholder="Select Economic Status"
                options={economicStatusOptions}
                labelClassName="text-(--color-muted)"
                error={errors.economicStatus?.message}
                value={watch('economicStatus') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('economicStatus', selectedValue);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 md:justify-end my-4">
          <Button
            variant="secondary"
            className="w-full md:w-[10%]"
            type="button"
            onClick={onPrev}
          >
            <span className="mx-auto w-full text-base">Back</span>
          </Button>
          <Button variant="primary" className="w-full md:w-[10%]" type="submit">
            <span className="mx-auto w-full text-base">Next</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
