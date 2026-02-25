/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { LogTestClient } from "./LogTestClient";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Temporary CloudWatch Log Test</h1>
      <LogTestClient />
    </div>
  );
}
