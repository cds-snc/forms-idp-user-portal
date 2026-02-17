"use client";
import { Button } from "@components/clientComponents/globals";
import { getImageUrl } from "@lib/imageUrl";
import Image from "next/image";
import Link from "next/link";

// TODO may not need to be a client component if Link can be used instead of button
// TODO add translation strings

export const Authentication = ({
  u2fInfo,
  authenticatorStatus,
  onRemoveU2F,
}: {
  u2fInfo: Array<{ id: string; name: string; state?: string }>;
  authenticatorStatus: boolean;
  onRemoveU2F: (u2fId: string) => Promise<void>;
}) => {
  const handleRemove = async (u2fId: string) => {
    await onRemoveU2F(u2fId);
  };

  const handleRemoveAuthenticator = () => {
    // TODO: implement TOTP removal
    console.log("Remove authenticator app - not yet implemented");
  };

  if (!authenticatorStatus && u2fInfo.length === 0) {
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
            {u2fInfo.length > 0 &&
              u2fInfo.map((data) => {
                return (
                  <li key={data.id} className="mb-4">
                    <Image
                      src={getImageUrl("/img/fingerprint_24px.png")}
                      alt=""
                      width={32}
                      height={32}
                      className="mr-2 inline-block"
                    />
                    <span className="mr-2 font-semibold">Security key</span>
                    <span>({data.name || "Unkown device"})</span>
                    <span className="mx-2">&#8226;</span>
                    <Button onClick={() => handleRemove(data.id)} theme="link">
                      Remove
                    </Button>
                  </li>
                );
              })}

            {authenticatorStatus && (
              <li className="mb-4">
                <Image
                  src={getImageUrl("/img/verified_user_24px.png")}
                  alt=""
                  width={32}
                  height={32}
                  className="mr-2 inline-block"
                />
                <span className="mr-2 font-semibold">Authenticator app</span>
                <span className="mx-2">&#8226;</span>
                <Button onClick={handleRemoveAuthenticator} theme="link">
                  Remove
                </Button>
              </li>
            )}
          </ul>
        </div>
        <div className="mt-6 flex align-middle">
          <Image
            src={getImageUrl("/img/plus.svg")}
            alt=""
            width={24}
            height={24}
            className="mr-1"
          />{" "}
          <Link href="/mfa/set">Add additional method</Link>
        </div>
      </div>
    </>
  );
};
