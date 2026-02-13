"use client";

import { useEffect } from "react";
import Image from "next/image";
import { I18n } from "@i18n";
import { getImageUrl } from "@lib/imageUrl";

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="">
      <div className="text-center">
        <h1 className="!mb-6 mt-8">
          <I18n i18nKey="title" namespace="error" />
        </h1>
        <Image
          src={getImageUrl("/img/goose.png")}
          alt="Goose"
          width={200}
          height={200}
          className="mx-auto mb-6"
          priority
        />
      </div>
    </div>
  );
}
