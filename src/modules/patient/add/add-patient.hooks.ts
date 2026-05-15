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
}

export const useAddPatient = (): UseAddPatientReturn => {
  const dispatch = useAppDispatch();
  const { hwProfile } = useProfileContext();

  const handleAddPatient = async (
    patientData: PatientFormData
  ): Promise<string | false> => {
    try {
      // Encode OpenMRS basic auth
      const formattedPatientData = mapPatientFormData(patientData);
      formattedPatientData.identifiers[0].identifier =
        await generateIdentifier();
      const patient = await patientService.createPatient(formattedPatientData);

      if (patient && patientData.personalInfo.profilePhoto) {
        await profileService.updateProfileImage({
          person: patient.uuid,
          base64EncodedImage: patientData.personalInfo.profilePhoto.split(
            ','
          )[1] as string,
        });
      }

      // Store patient UUID for visit upload
      storage.set('patientUuid', patient.uuid);

      // Track locally so achievement counts update immediately
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

      //show toast message
      showToast(
        'Patient Added Successfully',
        `Patient has been added successfully`,
        'success'
      );
      return patient.uuid;
    } catch (error: unknown) {
      //show toast message
      showToast(
        'Add Patient Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        'error'
      );
      return false;
    }
  };

  const generateIdentifier = async (): Promise<string> => {
    // Logic to generate a unique patient identifier
    const response = await patientService.genratePatientIdentifier();
    return response.identifiers[0];
  };

  const mapPatientFormData = (data: PatientFormData): AddPatientData => {
    const attributes = [];

    // Map phone number
    if (data.personalInfo.phoneNumber) {
      attributes.push({
        value: `${data.personalInfo.phoneNumberCountryCode}${data.personalInfo.phoneNumber}`,
        attributeType: patientAttributes.telephoneNumber,
      });
    }

    // Map emergency contact type
    if (data.personalInfo.contactType) {
      attributes.push({
        value: data.personalInfo.contactType,
        attributeType: patientAttributes.emergencyContactType,
      });
    }

    // Map emergency contact name
    if (data.personalInfo.emergencyContactName) {
      attributes.push({
        value: data.personalInfo.emergencyContactName,
        attributeType: patientAttributes.emergencyContactName,
      });
    }

    // Map emergency contact number
    if (data.personalInfo.emergencyContactNumber) {
      attributes.push({
        value: `${data.personalInfo.emergencyContactNumberCountryCode}${data.personalInfo.emergencyContactNumber}`,
        attributeType: patientAttributes.emergencyContactNumber,
      });
    }

    // Map other info
    if (data.otherInfo.sonDaughterWifeOf) {
      attributes.push({
        value: data.otherInfo.sonDaughterWifeOf,
        attributeType: patientAttributes.sonDaughterWifeOf,
      });
    }

    if (data.otherInfo.occupation) {
      attributes.push({
        value: data.otherInfo.occupation,
        attributeType: patientAttributes.occupation,
      });
    }

    if (data.otherInfo.caste) {
      attributes.push({
        value: data.otherInfo.caste,
        attributeType: patientAttributes.caste,
      });
    }

    if (data.otherInfo.education) {
      attributes.push({
        value: data.otherInfo.education,
        attributeType: patientAttributes.education,
      });
    }

    if (data.otherInfo.economicStatus) {
      attributes.push({
        value: data.otherInfo.economicStatus,
        attributeType: patientAttributes.economicStatus,
      });
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

  return { handleAddPatient };
};
