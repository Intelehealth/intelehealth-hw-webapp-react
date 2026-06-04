import {
  locations,
  patientAttributes,
  patientIdentifierType,
} from '../../../assets/data/openmrs_uuids';
import { useProfileContext } from '../../../context/ProfileContext';
import { addLocalPatient } from '../../../reducers/achievement.reducer';
import { showToast } from '../../../services/toast';
import { useAppDispatch } from '../../../store/hooks';
import type {
  AddPatientData,
  PatientFormData,
} from '../../../types/patient/add/add-patient.types';
import { storage } from '../../../utils/storage';
import { profileService } from '../../profile/profile.service';
import { patientService } from './add-patient.service';

interface UseAddPatientReturn {
  handleAddPatient: (patientData: PatientFormData) => Promise<string | false>;
  handleUpdatePatient: (
    uuid: string,
    patientData: PatientFormData
  ) => Promise<string | false>;
}

export const useAddPatient = (): UseAddPatientReturn => {
  const dispatch = useAppDispatch();
  const { hwProfile } = useProfileContext();

  const handleAddPatient = async (
    patientData: PatientFormData
  ): Promise<string | false> => {
    try {
      const formattedPatientData = mapPatientFormData(patientData);
      formattedPatientData.identifiers[0].identifier =
        await generateIdentifier();
      const patient = await patientService.createPatient(formattedPatientData);

      if (
        patient &&
        patientData.personalInfo.profilePhoto?.startsWith('data:')
      ) {
        await profileService.updateProfileImage({
          person: patient.uuid,
          base64EncodedImage: patientData.personalInfo.profilePhoto.split(
            ','
          )[1] as string,
        });
      }

      storage.set('patientUuid', patient.uuid);

      const providerUuid = hwProfile?.providerUuid;
      if (providerUuid) {
        const d = new Date();
        const createdDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dispatch(
          addLocalPatient({
            patientuuid: patient.uuid,
            providerUuid,
            createdDate,
          })
        );
      }

      showToast(
        'Patient Added Successfully',
        `Patient has been added successfully`,
        'success'
      );
      return patient.uuid;
    } catch (error: unknown) {
      showToast(
        'Add Patient Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        'error'
      );
      return false;
    }
  };

  const handleUpdatePatient = async (
    uuid: string,
    patientData: PatientFormData
  ): Promise<string | false> => {
    try {
      const formattedData = mapPatientFormData(
        patientData,
        patientData.attributeUuids
      );
      // For update, send only the person data (no identifiers)
      await patientService.updatePatient(uuid, {
        person: formattedData.person,
      });

      if (patientData.personalInfo.profilePhoto?.startsWith('data:')) {
        await profileService.updateProfileImage({
          person: uuid,
          base64EncodedImage: patientData.personalInfo.profilePhoto.split(
            ','
          )[1] as string,
        });
      }

      showToast(
        'Patient Updated Successfully',
        'Patient has been updated successfully',
        'success'
      );
      return uuid;
    } catch (error: unknown) {
      showToast(
        'Update Patient Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        'error'
      );
      return false;
    }
  };

  const generateIdentifier = async (): Promise<string> => {
    const response = await patientService.genratePatientIdentifier();
    return response.identifiers[0];
  };

  const mapPatientFormData = (
    data: PatientFormData,
    attributeUuids?: Record<string, string>
  ): AddPatientData => {
    const attributes: {
      uuid?: string;
      value: string;
      attributeType: string;
    }[] = [];

    const pushAttr = (value: string, attributeType: string) => {
      const entry: { uuid?: string; value: string; attributeType: string } = {
        value,
        attributeType,
      };
      if (attributeUuids?.[attributeType]) {
        entry.uuid = attributeUuids[attributeType];
      }
      attributes.push(entry);
    };

    if (data.personalInfo.phoneNumber) {
      pushAttr(
        `${data.personalInfo.phoneNumberCountryCode}${data.personalInfo.phoneNumber}`,
        patientAttributes.telephoneNumber
      );
    }

    if (data.personalInfo.contactType) {
      pushAttr(
        data.personalInfo.contactType,
        patientAttributes.emergencyContactType
      );
    }

    if (data.personalInfo.emergencyContactName) {
      pushAttr(
        data.personalInfo.emergencyContactName,
        patientAttributes.emergencyContactName
      );
    }

    if (data.personalInfo.emergencyContactNumber) {
      pushAttr(
        `${data.personalInfo.emergencyContactNumberCountryCode}${data.personalInfo.emergencyContactNumber}`,
        patientAttributes.emergencyContactNumber
      );
    }

    if (data.otherInfo.sonDaughterWifeOf) {
      pushAttr(
        data.otherInfo.sonDaughterWifeOf,
        patientAttributes.sonDaughterWifeOf
      );
    }

    if (data.otherInfo.occupation) {
      pushAttr(data.otherInfo.occupation, patientAttributes.occupation);
    }

    if (data.otherInfo.caste) {
      pushAttr(data.otherInfo.caste, patientAttributes.caste);
    }

    if (data.otherInfo.education) {
      pushAttr(data.otherInfo.education, patientAttributes.education);
    }

    if (data.otherInfo.economicStatus) {
      pushAttr(data.otherInfo.economicStatus, patientAttributes.economicStatus);
    }

    return {
      identifiers: [
        {
          identifier: '',
          identifierType: patientIdentifierType.default,
          location: locations.default,
          preferred: true,
        },
      ],
      person: {
        birthdate: data.personalInfo.dateOfBirth,
        gender: data.personalInfo.gender,
        names: [
          {
            givenName: data.personalInfo.firstName,
            middleName: data.personalInfo.middleName,
            familyName: data.personalInfo.lastName,
          },
        ],
        addresses: [
          {
            address1: data.addressInfo.correspondingAddress1,
            address2: data.addressInfo.correspondingAddress2,
            address3: '',
            address6: '',
            cityVillage: data.addressInfo.city,
            country: data.addressInfo.country,
            countyDistrict: data.addressInfo.district,
            postalCode: data.addressInfo.postalCode,
            stateProvince: data.addressInfo.state,
          },
        ],
        attributes,
      },
    };
  };

  return { handleAddPatient, handleUpdatePatient };
};
