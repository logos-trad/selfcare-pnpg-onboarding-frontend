import {
  BusinessPnpg,
  InstitutionsPnpg,
  PnpgInstitutionLegalAddressResource,
  User,
} from '../types';
import { OnboardingPnPgApi } from '../api/OnboardingPnPgApiClient';
import { mockedOnboardingPnPgApi } from '../api/__mocks__/OnboardingPnPgApiClient';
import { mockedInstitutionPnPG } from '../api/__mocks__/OnboardingPnPgApiClient';

export const getInstitutionsByUser = (user: User): Promise<InstitutionsPnpg> => {
  /* istanbul ignore if */
  if (process.env.REACT_APP_MOCK_API === 'true') {
    return new Promise((resolve) => resolve(mockedInstitutionPnPG));
  } else {
    return OnboardingPnPgApi.getInstitutionsByUser(user);
  }
};

export const matchInstitutionAndUser = (
  externalInstitutionId: string,
  loggedUser: User
): Promise<boolean> => {
  /* istanbul ignore if */
  if (process.env.REACT_APP_MOCK_API === 'true') {
    return mockedOnboardingPnPgApi.matchInstitutionAndUser(externalInstitutionId, loggedUser);
  } else {
    return OnboardingPnPgApi.matchInstitutionAndUser(externalInstitutionId, loggedUser);
  }
};

export const getInstitutionLegalAddress = (
  externalInstitutionId: string
): Promise<PnpgInstitutionLegalAddressResource> => {
  /* istanbul ignore if */
  if (process.env.REACT_APP_MOCK_API === 'true') {
    return mockedOnboardingPnPgApi.getInstitutionLegalAddress(externalInstitutionId);
  } else {
    return OnboardingPnPgApi.getInstitutionLegalAddress(externalInstitutionId);
  }
};

export const onboardingPGSubmit = (
  externalInstitutionId: string,
  productId: string,
  loggedUser: User,
  selectedInstitution: BusinessPnpg
): Promise<boolean> => {
  /* istanbul ignore if */
  if (process.env.REACT_APP_MOCK_API === 'true') {
    return mockedOnboardingPnPgApi.onboardingPGSubmit(externalInstitutionId);
  } else {
    return OnboardingPnPgApi.onboardingPGSubmit(
      externalInstitutionId,
      productId,
      loggedUser,
      selectedInstitution
    );
  }
};