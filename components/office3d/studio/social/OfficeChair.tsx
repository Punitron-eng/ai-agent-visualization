"use client";

/**
 * The ergonomic office chair used around the collaboration table.
 *
 * It is deliberately the same rig the development floor sits on — one seat
 * geometry, one dark material, shared by every chair in the building — so this
 * module is a name, not a second chair. Duplicating the geometry here would
 * cost a second set of GPU resources and guarantee the two drift apart.
 */
export { TaskChair as OfficeChair } from "@/components/office3d/studio/Chair";
