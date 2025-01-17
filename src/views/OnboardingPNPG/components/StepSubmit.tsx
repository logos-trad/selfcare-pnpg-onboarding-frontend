import { useEffect, useState } from 'react';
import { trackEvent } from '@pagopa/selfcare-common-frontend/lib/services/analyticsService';
import { EndingPage, useErrorDispatcher } from '@pagopa/selfcare-common-frontend/lib';
import { useTranslation, Trans } from 'react-i18next';
import {
  storageTokenOps,
  storageUserOps,
} from '@pagopa/selfcare-common-frontend/lib/utils/storage';
import { IllusError } from '@pagopa/mui-italia/dist/illustrations/Error';
import { uniqueId } from 'lodash';
import { Business, StepperStepComponentProps, User } from '../../../types';
import { ENV } from '../../../utils/env';
import { useHistoryState } from '../../../components/useHistoryState';
import { onboardingPGSubmit } from '../../../services/onboardingService';
import { RoleEnum } from '../../../api/generated/b4f-onboarding/CompanyUserDto';
import { InstitutionOnboardingResource } from '../../../api/generated/b4f-onboarding/InstitutionOnboardingResource';

type Props = StepperStepComponentProps & {
  setLoading: (loading: boolean) => void;
  setOnboardingData: React.Dispatch<
    React.SetStateAction<InstitutionOnboardingResource | undefined>
  >;
};

function StepSubmit({ forward, setOnboardingData, setLoading }: Props) {
  const { t } = useTranslation();
  const addError = useErrorDispatcher();

  const [selectedBusiness, setSelectedBusiness, setSelectedBusinessHistory] = useHistoryState<
    Business | undefined
  >('selected_business', undefined);
  const [insertedBusinessEmail, _setInsertedBusinessEmail, setInsertedBusinessEmailHistory] =
    useHistoryState<string>('inserted_business_email', undefined);

  const [error, setError] = useState<'alreadyOnboarded' | 'genericError'>();

  const requestId = uniqueId();

  const productId = 'prod-pn-pg';

  useEffect(() => {
    const loggedUser = storageUserOps.read();
    if (!error && selectedBusiness && loggedUser) {
      setLoading(true);
      submit(selectedBusiness.businessTaxId, productId, selectedBusiness, loggedUser)
        .catch((reason) => {
          addError({
            id: 'ONBOARDING_PNPG_SUBMIT_ERROR',
            blocking: false,
            error: reason,
            techDescription: `An error occurred while submit onboarding of ${selectedBusiness}`,
            toNotify: true,
          });
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const submit = async (
    businessId: string,
    productId: string,
    selectedBusiness: Business,
    loggedUser: User
  ) => {
    const sessionToken = storageTokenOps.read();
    setLoading(true);
    await onboardingPGSubmit(
      businessId,
      productId,
      {
        taxCode: loggedUser.taxCode,
        name: loggedUser.name,
        surname: loggedUser.surname,
        email: loggedUser.email,
        role: 'MANAGER' as RoleEnum,
      },
      selectedBusiness,
      insertedBusinessEmail
    )
      .then(async () => {
        trackEvent('ONBOARDING_PG_SUBMIT_SUCCESS', {
          requestId,
          productId,
        });
        // TODO Temporary used fetch method instead of codegen, this will be replaced with PNPG-253
        setLoading(true);
        try {
          const response = await fetch(
            `${ENV.URL_API.ONBOARDING}/v2/institutions/onboarding/active?taxCode=${selectedBusiness.businessTaxId}&productId=${productId}`,
            {
              headers: {
                accept: '*/*',
                'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                authorization: `Bearer ${sessionToken}`,
              },
              method: 'GET',
              mode: 'cors',
            }
          );
          const businesses = (await response.json()) as Array<InstitutionOnboardingResource>;
          if (businesses[0]) {
            setOnboardingData(businesses[0]);
          }
        } catch (reason) {
          addError({
            id: 'RETRIEVING_ONBOARDED_PARTY_ERROR',
            blocking: false,
            error: reason as Error,
            techDescription: `An error occurred while retrieving onboarded party of ${selectedBusiness}`,
            toNotify: true,
          });
        }
        setLoading(false);
        setSelectedBusiness(selectedBusiness);
        setSelectedBusinessHistory(selectedBusiness);
        forward();
      })
      .catch(() => {
        setError('genericError');
        trackEvent('ONBOARDING_PG_SUBMIT_GENERIC_ERROR', {
          requestId,
          productId,
        });
      })
      .finally(() => {
        setInsertedBusinessEmailHistory('');
      });
    setLoading(false);
  };

  return error === 'genericError' ? (
    <EndingPage
      minHeight="52vh"
      icon={<IllusError size={60} />}
      title={t('outcome.error.title')}
      description={
        <Trans i18nKey="outcome.error.description">
          A causa di un problema tecnico, non riusciamo a registrare <br />
          l&apos;impresa. Riprova più tardi.
        </Trans>
      }
      variantTitle={'h4'}
      variantDescription={'body1'}
      buttonLabel={t('outcome.error.close')}
      onButtonClick={() => window.location.assign(ENV.URL_FE.LOGIN)}
    />
  ) : (
    <></>
  );
}
export default StepSubmit;
