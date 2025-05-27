This is a File Sharing App built with [Next.js](https://nextjs.org), [Firestore](https://firebase.google.com/docs/firestore), [Firebase Authentication](https://firebase.google.com/docs/auth), and [Permit.io](https://permit.io).

## Getting Started

First, run `npm install` or `yarn install` or `pnpm install` or `bun install` to install the dependencies. 

Then, add your project keys to the `.env` file.

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
APIKEY=
AUTHDOMAIN=
PROJECTID=
STORAGE_BUCKET=
MESSAGING_ID=
APPID=
MEASUREMENTID=
# envs for AWS
AWS_REGION=
AWS_ACCESS_KEY=
AWS_BUCKET_NAME=

AWS_SECRET_KEY=

PERMIT_API_KEY=
```

Finally, run the development server with the following command:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

