import type { Cookie } from "@lib/cookies";
import { cn } from "@lib/utils";
import { ArrowRightNav } from "@components/icons/ArrowRightNav";
import { Button } from "@components/ui/button/Button";
type SessionSelectProps = {
  sessions: Map<string, Cookie>;
  selectSession: (sessionId: string) => void;
};

export const SessionSelect = ({ sessions, selectSession }: SessionSelectProps) => {
  return (
    <div className="flex flex-col">
      {Array.from(sessions.entries()).map(([id, session], index) => (
        <SessionTile
          key={id}
          session={session}
          first={index === 0}
          last={sessions.size === index + 1}
          select={selectSession}
        />
      ))}
      <div className="flex flex-row items-center rounded-b-2xl border-x-2.5 border-b-2.5 border-gcds-grayscale-400 p-4">
        <div className="grow">Other Account</div>
        <div className="float-right">
          <Button
            type="button"
            aria-label={`Continue with Other Account`}
            onClick={() => selectSession("other")}
          >
            <ArrowRightNav />
          </Button>
        </div>
      </div>
    </div>
  );
};

const SessionTile = ({
  session,
  first,
  last,
  select,
}: {
  session: Cookie;
  first: boolean;
  last: boolean;
  select: (id: string) => void;
}) => {
  return (
    <div
      className={cn([
        "flex flex-row items-center border-x-2.5 border-t-2.5 border-gcds-blue-200 p-4",
        first && "rounded-t-2xl",
        last && "border-b-2.5",
      ])}
    >
      <div className="grow">{session.loginName}</div>
      <div className="float-right">
        <Button
          type="button"
          aria-label={`Continue with ${session.loginName}`}
          onClick={() => select(session.id)}
        >
          <ArrowRightNav />
        </Button>
      </div>
    </div>
  );
};
