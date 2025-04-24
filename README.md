This is a File Sharing App built with [Next.js](https://nextjs.org), [Firestore](https://firebase.google.com/docs/firestore), [Firebase Authentication](https://firebase.google.com/docs/auth), and [Permit.io](https://permit.io).

## Getting Started

First, run `npm install` or `yarn install` or `pnpm install` or `bun install` to install the dependencies. 

Then, add your project keys to the `.env` file.

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_APIKEY=
NEXT_PUBLIC_AUTHDOMAIN=
NEXT_PUBLIC_PROJECTID=
NEXT_PUBLIC_STORAGE_BUCKET=
NEXT_PUBLIC_MESSAGING_ID=
NEXT_PUBLIC_APPID=
NEXT_PUBLIC_MEASUREMENTID=
# envs for AWS
NEXT_PUBLIC_AWS_REGION=
NEXT_PUBLIC_AWS_ACCESS_KEY=
NEXT_PUBLIC_AWS_BUCKET_NAME=

NEXT_PUBLIC_AWS_SECRET_KEY=

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

