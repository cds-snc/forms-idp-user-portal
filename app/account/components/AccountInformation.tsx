import { LinkButton } from "@components/serverComponents/globals/Buttons/LinkButton";

// TODO add translation strings

export const AccountInformation = ({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) => {
  return (
    <>
      <div className="rounded-2xl border-1 border-[#D1D5DB] bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="mb-6">Account Information</h3>
          <div>
            <LinkButton.Primary href="/password/change">Change</LinkButton.Primary>
          </div>
        </div>
        <div>
          <ul className="list-none p-0">
            <li className="mb-4">
              <div className="mb-1 font-semibold">First name</div>
              <div>
                <em>{firstName}</em>
              </div>
            </li>
            <li className="mb-4">
              <div className="mb-1 font-semibold">Last name</div>
              <div>
                <em>{lastName}</em>
              </div>
            </li>
            <li className="mb-4">
              <div className="mb-1 font-semibold">Email address</div>
              <div>
                <em>{email}</em>
              </div>
            </li>
            <li className="">
              <div className="mb-1 font-semibold">Password</div>
              {/* Placeholder password characters used instead of real password for security reasons */}
              <div>
                &#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
