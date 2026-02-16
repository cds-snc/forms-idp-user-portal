"use client";
import { Button } from "@components/clientComponents/globals";
import Image from "next/image";
import { AuthFactorU2F } from "@zitadel/proto/zitadel/user/v2/user_pb";

// TODO may not need to be a client component if Link can be used instead of button
// TODO add translation strings

export const Authentication = ({
  yubikeyInfo,
  authenticatorStatus,
}: {
  yubikeyInfo: AuthFactorU2F[];
  authenticatorStatus: boolean;
}) => {
  const handleRemove = () => {
    // TODO implement remove functionality
    // Maybe link instead to a new "/mfa/remove" or existing"/mfa/set"?
    alert("TODO");
  };

  if (!authenticatorStatus && yubikeyInfo.length === 0) {
    return (
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <h3 className="mb-6">Authentication</h3>
        <p>No two-factor authentication methods configured.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <h3 className="mb-6">Authentication</h3>
        <div>
          <ul className="list-none p-0">
            {yubikeyInfo.length > 0 &&
              yubikeyInfo.map((data) => {
                return (
                  <li key={data.id} className="mb-4">
                    <Image
                      src="/img/fingerprint_24px.png"
                      alt=""
                      width={32}
                      height={32}
                      className="mr-2 inline-block"
                    />
                    <span className="mr-2 font-semibold">Security key</span>
                    <span>{data.name}</span>
                    <span className="mx-2">&#8226;</span>
                    <Button onClick={handleRemove} theme="link">
                      Remove
                    </Button>
                  </li>
                );
              })}

            {authenticatorStatus && (
              <li className="mb-4">
                <Image
                  src="/img/verified_user_24px.png"
                  alt=""
                  width={32}
                  height={32}
                  className="mr-2 inline-block"
                />
                <span className="mr-2 font-semibold">Authenticator app</span>
                <span className="mx-2">&#8226;</span>
                <Button onClick={handleRemove} theme="link">
                  Remove
                </Button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};
