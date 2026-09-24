/** Whether `value` looks like a Mongo ObjectId (verified catalog dhikr id), as opposed to a locally-generated personal dhikr id. */
export function isObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
