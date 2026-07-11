import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase";
import { CreateMessagePayload, ScheduledMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateMessagePayload = await req.json();
    const { chatId, message, scheduledAt, recurring } = body;

    if (!chatId || !message || !scheduledAt || !recurring) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: chatId, message, scheduledAt, recurring",
        },
        { status: 400 },
      );
    }

    const scheduled = new Date(scheduledAt);
    if (isNaN(scheduled.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledAt date format." },
        { status: 400 },
      );
    }

    const db = getFirebaseAdmin();
    const doc: Omit<ScheduledMessage, "id"> = {
      chatId,
      message,
      scheduledAt: scheduled.toISOString(),
      recurring,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("scheduled_messages").add(doc);
    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (err: unknown) {
    console.error("[schedule POST] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = getFirebaseAdmin();
    await db.collection("scheduled_messages").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[schedule DELETE] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getFirebaseAdmin();
    const snapshot = await db
      .collection("scheduled_messages")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const messages: ScheduledMessage[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ScheduledMessage, "id">),
    }));

    return NextResponse.json(messages);
  } catch (err: unknown) {
    console.error("[schedule GET] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
