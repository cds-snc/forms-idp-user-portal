"use client";
import { Button } from "@components/clientComponents/globals";
import Image from "next/image";

// TODO may not need to be a client component if Link can be used instead of butt
// TODO add translation strings

export const Authentication = () => {
  const handleRemove = () => {
    // TODO implement remove functionality
    // Maybe this "/mfa/set" ?
  };

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <h3 className="mb-6">Authentication</h3>
        <div>
          <ul className="list-none p-0">
            <li className="mb-4">
              <Image
                src="/img/fingerprint_24px.png"
                alt=""
                width={32}
                height={32}
                className="mr-2 inline-block"
              />
              <span className="mr-2 font-semibold">Security key</span>
              <span>(Government issued Yubikey)</span>
              <span className="mx-2">&#8226;</span>
              <Button onClick={handleRemove} theme="link">
                Remove
              </Button>
            </li>
            <li className="mb-4">
              <Image
                src="/img/verified_user_24px.png"
                alt=""
                width={32}
                height={32}
                className="mr-2 inline-block"
              />
              <span className="mr-2 font-semibold">Authenticator app</span>
              <span>(e.g Google/Microsoft authenticator, Authy)</span>
              <span className="mx-2">&#8226;</span>
              <Button onClick={handleRemove} theme="link">
                Remove
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
