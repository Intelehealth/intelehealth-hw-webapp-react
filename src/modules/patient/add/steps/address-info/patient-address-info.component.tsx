import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, type Resolver } from 'react-hook-form';
import type { InferType } from 'yup';
import { Button, Input } from '../../../../../components/common';
import CitySelector from '../../../../../components/common/city-selector.component';
import CountrySelect from '../../../../../components/common/country-select.component';
import StateSelector from '../../../../../components/common/state-selector.component';
import { patientAddressInfoSchema } from './patient-address-info.validation';

type PatientAddressInfoFormValues = InferType<typeof patientAddressInfoSchema>;

interface PatientAddressInfoProps {
  defaultValues: PatientAddressInfoFormValues;
  onNext: (data: { addressInfo: PatientAddressInfoFormValues }) => void;
  onPrev: () => void;
}

export default function PatientAddressInfo({
  defaultValues,
  onNext,
  onPrev,
}: PatientAddressInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientAddressInfoFormValues>({
    resolver: yupResolver(
      patientAddressInfoSchema
    ) as Resolver<PatientAddressInfoFormValues>,
    mode: 'onTouched',
    defaultValues,
  });

  const handleNext = (data: PatientAddressInfoFormValues) => {
    onNext({ addressInfo: data });
  };

  return (
    <form onSubmit={handleSubmit(handleNext)} className="space-y-6 h-full">
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
              <CountrySelect
                label="Country"
                placeholder="Select Country"
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
              <StateSelector
                countryId={watch('country') ?? ''}
                label="State"
                placeholder="Select State"
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
              <CitySelector
                countryId={watch('country') ?? ''}
                stateId={watch('state') ?? ''}
                label="District"
                placeholder="Select District"
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
              <Input
                {...register('city')}
                placeholder="Enter Village/Town/City"
                label="Village/Town/City"
                error={errors.city?.message}
                isRequired={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 ">
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
          <div className="grid grid-cols-1 md:grid-cols-1 ">
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
