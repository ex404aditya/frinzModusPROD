import { auth, http, postgresql } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";
import { User, ExampleClaims } from "./models";
import { convertToUUID } from "./utils";

@json
class ClerkUser {
  public id!: string;
  public first_name!: string;
  public last_name!: string;
  public email_addresses!: Array<EmailAddress>;
  public image_url!: string;
}

@json
class EmailAddress {
  public email_address!: string;
}

@json
class ClerkResponse {
  public _id!: string;
}

export function getCurrentUser(): User {
  const claims = auth.getJWTClaims<ExampleClaims>();
  const secretKey = "sk_test_5x2zwR38nTthpzAVVKBEYxq4wZzHykd9EEVCAj1i1p";
  console.log(`claims: ${claims.sub}`);
//   First check if user exists in our database
  const existingUser = getUserByClerkId(claims.sub);
  if (existingUser) {
    return existingUser;
  }

  // If not, fetch from Clerk and create new user
  const request = new http.Request(`https://api.clerk.dev/v1/users/${claims.sub}`);
  request.headers.append("Authorization", `Bearer ${secretKey}`);
  
  const response = http.fetch(request);
  const responseBody = response.text();

  if (response.status !== 200) {
    throw new Error(`Failed to fetch user data from Clerk: ${response.status}`);
  }

  const clerkUser = JSON.parse<ClerkUser>(responseBody);
  console.log(`clerkUser: ${clerkUser.id}`);
  if (!clerkUser) {
    throw new Error("Failed to parse user data from Clerk response");
  }

  return createUser(clerkUser);
}

function getUserByClerkId(clerkId: string): User | null {
  const query = "SELECT * FROM users WHERE clerkid = $1";
  const params = new postgresql.Params();
  params.push(clerkId);
  
  const response = postgresql.query<User>("frinzdb", query, params);
  if (response.rows.length > 0) {
    const user = response.rows[0];
    user.id = convertToUUID(user.id);
    return user;
  }
  return null;
}

function createUser(clerkUser: ClerkUser): User {
  const query = `
    INSERT INTO users (email, firstname, lastname, clerkid, image)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const params = new postgresql.Params();
  params.push(clerkUser.email_addresses[0].email_address);
  params.push(clerkUser.first_name);
  params.push(clerkUser.last_name);
  params.push(clerkUser.id);
  params.push(clerkUser.image_url);

  const response = postgresql.query<User>("frinzdb", query, params);
  const user = response.rows[0];
  user.id = convertToUUID(user.id);
  return user;
} 