import { config } from '../config.ts';

export async function authorizeProjectRoomAccess(
  idToken: string,
  uid: string,
  roomId: string
): Promise<boolean> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(roomId)) return false;

  const { projectId, firestoreDatabaseId } = config.firebase;
  if (!projectId) return false;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(
      firestoreDatabaseId
    )}/documents/projects/${encodeURIComponent(roomId)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;

    const docData = (await res.json()) as {
      fields?: {
        ownerId?: { stringValue?: string };
        assignedFreelancerId?: { stringValue?: string };
        status?: { stringValue?: string };
      };
    };

    const fields = docData.fields;
    if (!fields) return false;

    const ownerId = fields.ownerId?.stringValue || '';
    const assignedId = fields.assignedFreelancerId?.stringValue || '';
    const status = fields.status?.stringValue || '';

    return ownerId === uid || assignedId === uid || status === 'open';
  } catch {
    return false;
  }
}
