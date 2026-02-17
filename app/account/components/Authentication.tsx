"use client";
import { Button, toast } from "@components/clientComponents/globals";
import { getImageUrl } from "@lib/imageUrl";
import Image from "next/image";
import Link from "next/link";
import { removeTOTPAction, removeU2FAction } from "../actions";

// TODO add translation strings

export const Authentication = ({
  u2fList,
  userId,
  authenticatorStatus,
}: {
  u2fList: Array<{ id: string; name: string; state?: string }>;
  userId: string;
  authenticatorStatus: boolean;
}) => {
  const handleRemoveU2F = async (u2fId: string) => {
    const result = await removeU2FAction(userId, u2fId);
    if (result.success) {
      toast.success("Security key removed successfully", "account");
      return;
    }
    toast.error(result.error || "Failed to remove security key", "account");
  };

  const handleRemoveAuthenticator = async () => {
    const result = await removeTOTPAction(userId);
    if (result.success) {
      toast.success("Authenticator app removed successfully", "account");
      return;
    }
    toast.error(result.error || "Failed to remove authenticator", "account");
  };

  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <h3 className="mb-6">Authentication</h3>

        {u2fList.length === 0 && !authenticatorStatus && (
          <p>No two-factor authentication methods configured.</p>
        )}

        <div>
          <ul className="list-none p-0">
            {u2fList.length > 0 &&
              u2fList.map((data) => {
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
                    <Button onClick={() => handleRemoveU2F(data.id)} theme="link">
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
