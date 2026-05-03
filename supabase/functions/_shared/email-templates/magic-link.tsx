/// <reference types="npm:@types/react@18.3.1" />

import * as React from "npm:react@18.3.1";

import { Body, Container, Head, Heading, Html, Img, Preview, Text } from "npm:@react-email/components@0.0.22";

interface MagicLinkEmailProps {
  siteName: string;
  siteUrl: string;
  token: string;
}

export const MagicLinkEmail = ({ siteName, siteUrl, token }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} sign-in code: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={`${siteUrl}/favicon.png`} width="40" height="40" alt={siteName} style={logo} />
        <Heading style={h1}>Sign in to {siteName}</Heading>
        <Text style={text}>Enter this 8-digit code to finish signing in. The code expires shortly.</Text>
        <div style={codeBox}>{token}</div>
        <Text style={footer}>If you didn't request this code, you can safely ignore this email.</Text>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "'Inter', Arial, sans-serif" };
const container = { padding: "20px 25px" };
const logo = { marginBottom: "20px" };
const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "hsl(220, 14%, 20%)",
  margin: "0 0 20px",
};
const text = {
  fontSize: "14px",
  color: "hsl(220, 8%, 46%)",
  lineHeight: "1.5",
  margin: "0 0 20px",
};
const codeBox = {
  fontSize: "32px",
  fontWeight: "bold" as const,
  letterSpacing: "8px",
  color: "hsl(153, 32%, 42%)",
  backgroundColor: "hsl(150, 20%, 96%)",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
  fontFamily: "'Courier New', monospace",
  margin: "0 0 25px",
};
const footer = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
