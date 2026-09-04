import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/db/helpers";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const target = form.get("target") === "category" ? "categories" : "products";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Files must be 10 MB or smaller" }, { status: 400 });
    }
    if (target === "categories" ? !file.type.startsWith("image/") : !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: target === "categories" ? "Only image files are supported for categories" : "Only image and video files are supported" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${target}/${crypto.randomUUID()}.${extension}`;
    const service = createServiceClient();
    const { error } = await service.storage
      .from("product-media")
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = service.storage.from("product-media").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, type: file.type.startsWith("video/") ? "video" : "image" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
