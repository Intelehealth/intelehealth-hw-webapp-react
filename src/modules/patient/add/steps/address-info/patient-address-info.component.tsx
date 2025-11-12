import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import type { InferType } from 'yup';
import { countries } from '../../../../../assets/data/countries';
import { Button, Dropdown, Input } from '../../../../../components/common';
import { patientAddressInfoSchema } from './patient-address-info.validation';

type PatientAddressInfoFormValues = InferType<typeof patientAddressInfoSchema>;

interface PatientPersonalInfoProps {
  onNext: (data: PatientAddressInfoFormValues) => void;
  onPrev: () => void;
}

export default function PatientPersonalInfo({
  onNext,
  onPrev,
}: PatientPersonalInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientAddressInfoFormValues>({
    resolver: yupResolver(patientAddressInfoSchema),
    mode: 'onTouched',
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6 h-full">
      <div className="flex flex-col h-full">
        <div className="h-full flex flex-col gap-6 md:overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                {...register('postalCode')}
                placeholder="Enter Postal Code Name"
                label="Postal Code"
                error={errors.postalCode?.message}
                isRequired={true}
              />
            </div>
            <div>
              <Dropdown
                label="Country"
                placeholder="Select Country"
                options={countries.map(val => {
                  return { label: val.name, value: val.name };
                })}
                labelClassName="text-(--color-muted)"
                error={errors.country?.message}
                value={watch('country') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('country', selectedValue);
                }}
                isRequired={true}
              />
            </div>
            <div>
              <Dropdown
                label="State"
                placeholder="Select State"
                options={countries.map(val => {
                  return { label: val.name, value: val.name };
                })}
                labelClassName="text-(--color-muted)"
                error={errors.state?.message}
                value={watch('state') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('state', selectedValue);
                }}
                isRequired={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Dropdown
                label="District"
                placeholder="Select District"
                options={countries.map(val => {
                  return { label: val.name, value: val.name };
                })}
                labelClassName="text-(--color-muted)"
                error={errors.district?.message}
                value={watch('district') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('district', selectedValue);
                }}
                isRequired={true}
              />
            </div>
            <div>
              <Dropdown
                label="Village/Town/City"
                placeholder="Select Village/Town/City"
                options={countries.map(val => {
                  return { label: val.name, value: val.name };
                })}
                labelClassName="text-(--color-muted)"
                error={errors.city?.message}
                value={watch('city') ?? ''}
                onChange={(value: string | string[]) => {
                  const selectedValue = Array.isArray(value) ? value[0] : value;
                  setValue('city', selectedValue);
                }}
                isRequired={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                {...register('correspondingAddress1')}
                placeholder="Enter Corresponding Address 1"
                label="Corresponding Address"
                error={errors.correspondingAddress1?.message}
                isRequired={true}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                {...register('correspondingAddress2')}
                placeholder="Enter Corresponding Address 2"
                label="Corresponding Address 2"
                error={errors.correspondingAddress2?.message}
                isRequired={true}
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
