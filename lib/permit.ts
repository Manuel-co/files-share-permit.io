import { Permit } from "permitio";

 const permit = new Permit({
  // We’ll use our pdp instance running on docker
  pdp: "http://localhost:7766",
  // The secret token we got from the UI
  token: process.env.PERMIT_API_KEY,
});

export default permit