import { LinkButton } from "@components/serverComponents/globals/Buttons/LinkButton";

// TODO move to own route and file directory location later
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
          <h2>Account Information</h2>
          <div>
            <LinkButton.Primary href="/password/change">Change</LinkButton.Primary>
          </div>
        </div>
        <div>
          <ul className="list-none p-0">
            <li className="mb-4">
              <div className="mb-1">
                <strong>First name</strong>
              </div>
              <div>
                <em>{firstName}</em>
              </div>
            </li>
            <li className="mb-4">
              <div className="mb-1">
                <strong>Last name</strong>
              </div>
              <div>
                <em>{lastName}</em>
              </div>
            </li>
            <li className="mb-4">
              <div className="mb-1">
                <strong>Email address:</strong>
              </div>
              <div>
                <em>{email}</em>
              </div>
            </li>
            <li className="">
              <div className="mb-1">
                <strong>Password</strong>
              </div>
              {/* Placeholder password characters used instead for security reasons */}
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
