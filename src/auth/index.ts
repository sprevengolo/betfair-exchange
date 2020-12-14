import fs from "fs";
import https from 'https';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { LOGIN_ERROR_STATUS } from '@src/auth/auth'

const {
  BETFAIR_APP_KEY = '',
  BETFAIR_CERTIFICATE_PATH = '',
  BETFAIR_KEY_PATH = '',
  BETFAIR_CERTIFICATE_PASSPHRASE = '',
  BETFAIR_USERNAME = '',
  BETFAIR_PASSWORD = '',
} = process.env;

const AUTH_URL = 'https://identitysso-cert.betfair.com/api/certlogin'

const AUTH_RESPONSES: Record<LOGIN_ERROR_STATUS, string> = {
  ACCOUNT_ALREADY_LOCKED:                   'The account is already locked',
  ACCOUNT_NOW_LOCKED:                       'The account was just locked',
  ACCOUNT_PENDING_PASSWORD_CHANGE:          'The account must undergo password recovery to reactivate via https://identitysso.betfair.com/view/recoverpassword',
  ACTIONS_REQUIRED:                         'You must login to https://www.betfair.com to provide missing information.',
  AGENT_CLIENT_MASTER:                      'Agent Client Master',
  AGENT_CLIENT_MASTER_SUSPENDED:            'Suspended Agent Client Master',
  AUTHORIZED_ONLY_FOR_DOMAIN_RO:            'You are attempting to login to the Betfair Romania domain with a non .ro account.',
  AUTHORIZED_ONLY_FOR_DOMAIN_SE:            'You are attempting to login to the Betfair Swedish domain with a non .se account.',
  BETTING_RESTRICTED_LOCATION:              'The account is accessed from a location where betting is restricted',
  CERT_AUTH_REQUIRED:                       'Certificate required or certificate present but could not authenticate with it',
  CHANGE_PASSWORD_REQUIRED:                 'Change password required',
  CLOSED:                                   'The account is closed',
  DANISH_AUTHORIZATION_REQUIRED:            'Danish authorization required',
  DENMARK_MIGRATION_REQUIRED:               'Denmark migration required',
  DUPLICATE_CARDS:                          'Duplicate cards',
  EMAIL_LOGIN_NOT_ALLOWED:                  'This account has not opted in to log in with the email',
  INTERNATIONAL_TERMS_ACCEPTANCE_REQUIRED:  'The latest international terms and conditions must be accepted prior to logging in.',
  INVALID_CONNECTIVITY_TO_REGULATOR_DK:     'The DK regulator cannot be accessed due to some internal problems in the system behind or in at regulator; timeout cases included.',
  INVALID_CONNECTIVITY_TO_REGULATOR_IT:     'The IT regulator cannot be accessed due to some internal problems in the system behind or in at regulator; timeout cases included.',
  INVALID_USERNAME_OR_PASSWORD:             'The username or password are invalid',
  ITALIAN_CONTRACT_ACCEPTANCE_REQUIRED:     'The latest Italian contract version must be accepted. You must login to the website to accept the new conditions.',
  ITALIAN_PROFILING_ACCEPTANCE_REQUIRED:    'You must login to the website to accept the new conditions',
  KYC_SUSPEND:                              'KYC suspended',
  MULTIPLE_USERS_WITH_SAME_CREDENTIAL:      'There is more than one account with the same credential',
  NOT_AUTHORIZED_BY_REGULATOR_DK:           'The user identified by the given credentials is not authorized in the DK\'s jurisdictions due to the regulators\' policies. Ex: the user for which this session should be created is not allowed to act(play, bet) in the DK\'s jurisdiction.',
  NOT_AUTHORIZED_BY_REGULATOR_IT:           'The user identified by the given credentials is not authorized in the IT\'s jurisdictions due to the regulators\' policies. Ex: the user for which this session should be created is not allowed to act(play, bet) in the IT\'s jurisdiction.',
  PENDING_AUTH:                             'Pending Authentication',
  PERSONAL_MESSAGE_REQUIRED:                'Personal message required for the user',
  SECURITY_QUESTION_WRONG_3X:               'The user has entered wrong the security answer 3 times',
  SECURITY_RESTRICTED_LOCATION:             'The account is restricted due to security concerns',
  SELF_EXCLUDED:                            'The account has been self-excluded',
  SPAIN_MIGRATION_REQUIRED:                 'Spain migration required',
  SPANISH_TERMS_ACCEPTANCE_REQUIRED:        'The latest Spanish terms and conditions version must be accepted. You must login to the website to accept the new conditions.',
  SUSPENDED:                                'The account is suspended',
  SWEDEN_BANK_ID_VERIFICATION_REQUIRED:     'You must provided your Swedish bank id via Betfair.se before proceeding.',
  SWEDEN_NATIONAL_IDENTIFIER_REQUIRED:      'You must provided your Swedish National identifier via Betfair.se before proceeding.',
  TELBET_TERMS_CONDITIONS_NA:               'Telbet terms and conditions rejected',
  TEMPORARY_BAN_TOO_MANY_REQUESTS:          'The limit for successful login requests per minute has been exceeded. New login attempts will be banned for 20 minutes',
  TRADING_MASTER:                           'Trading Master Account',
  TRADING_MASTER_SUSPENDED:                 'Suspended Trading Master Account'
}
const CERT = (() => {
  try {
    fs.readFileSync(BETFAIR_CERTIFICATE_PATH).toString()
  } catch (error) {
    return '';
  }
})();

const KEY = (() => {
  try {
    fs.readFileSync(BETFAIR_KEY_PATH).toString()
  } catch (error) {
    return '';
  }
})();

export const authenticate = async () => {
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'X-Application': BETFAIR_APP_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    agent: new https.Agent({
      cert: CERT,
      key: KEY,
      passphrase: BETFAIR_CERTIFICATE_PASSPHRASE,
      rejectUnauthorized: true,
      keepAlive: false,
    }),
    body: new URLSearchParams([
      ['username', BETFAIR_USERNAME],
      ['password', BETFAIR_PASSWORD],
    ]),
  });

  if(!response.ok) throw Error(`${response.status}: ${response.statusText}`)

  const {sessionToken, loginStatus} = await response.json();

  if (loginStatus === 'SUCCESS') return sessionToken;

  throw Error(JSON.stringify({
    code: loginStatus,
    message: AUTH_RESPONSES[(loginStatus as LOGIN_ERROR_STATUS)]
  }))
}