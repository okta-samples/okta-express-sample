# Node.js Express Quickstart Sample Code for Integrating with Okta using the Redirect Model

This repository contains a sample of integrating with [Okta](https://www.okta.com/) for authentication using [the redirect model in a Node.js Express app](https://developer.okta.com/docs/guides/sign-into-web-app-redirect/node-express/main/).

Read more about getting started with Okta and authentication best practices on the [Okta Developer Portal](https://developer.okta.com).

This code sample demonstrates
* Configuring Okta
* Sign-in and sign-out
* Protecting routes
* Displaying user profile information from the ID Token

## Prerequisites

Before you begin, you’ll need an Okta Integrator Free Plan account. To get one, sign up for an [Integrator account](https://developer.okta.com/login). Once you have an account, sign in to your [Integrator account](https://developer.okta.com/login). Next, in the Admin Console:

1. Go to **Applications > Applications**
2. Click **Create App Integration**
3. Select **OIDC - OpenID Connect** as the sign-in method
4. Select **Web Application** as the application type, then click **Next**
5. Enter an app integration name
6. Configure the redirect URIs:
  - Sign-in redirect URIs: `http://localhost:3000/authorization-code/callback`
  - Sign-out redirect URIs: `http://localhost:3000`
7. In the **Controlled access** section, select the appropriate access level
8. Click **Save**

Creating an OIDC Web App manually in the Admin Console configures your Okta Org with the application settings.

## Get the Code

```bash
git clone https://github.com/okta-samples/okta-express-sample.git
cd okta-express-sample
```

Update your `.okta.env` file with the values from your application's configuration:

```text
ORG_URL="https://dev-133337.okta.com"
CLIENT_ID="0oab8eb55Kb9jdMIr5d6"
CLIENT_SECRET="NEVER-SHOW-SECRETS"
```

### Where are my new app's credentials?

After creating the app, you can find the configuration details on the app’s **General** tab:
- **Client ID:** Found in the **Client Credentials** section
- **Client Secret:** Click **Show** in the **Client Credentials** section to reveal
- **Issuer:** Found in the **Issuer URI** field for the authorization server that appears by selecting **Security > API** from the navigation pane.

## Run the Example

To run this application, install its dependencies:

```
npm install
```

With variables set, start your app:

```
npm start
```

Navigate to http://localhost:3000 in your browser.

If you see a home page that prompts you to login, then things are working!  Clicking the **Log in** button will redirect you to the Okta hosted sign-in page.

You can sign in with the same account that you created when signing up for your Developer Org, or you can use a known username and password from your Okta Directory.

> **Note:** If you are currently using your Developer Console, you already have a Single Sign-On (SSO) session for your Org.  You will be automatically logged into your application as the same user that is using the Developer Console.  You may want to use an incognito tab to test the flow from a blank slate.

## Helpful resources

* [Learn about Authentication, OAuth 2.0, and OpenID Connect](https://developer.okta.com/docs/concepts/)
* [Get started with Express](https://expressjs.com/en/starter/installing.html)

## Help

Please visit our [Okta Developer Forums](https://devforum.okta.com/).
