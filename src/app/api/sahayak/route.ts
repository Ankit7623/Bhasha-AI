import { POST as kisaanPOST } from "../kisaan/route";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  return kisaanPOST(req);
}
