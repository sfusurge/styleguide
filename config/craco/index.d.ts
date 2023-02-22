/**
 * Type definitions for JSONC files.
 */
declare module '*.jsonc' {
    type JsonType = JsonObject | JsonArray | JsonPrimitive;
    type JsonPrimitive = string | number | null;
    type JsonObject = {[key: JsonKey]: JsonObject}
    type JsonArray = Array<JsonType>;
    type JsonKey = string;

    // Technically it can be any JsonType, but it's not likely.
    // Being accurate is not worth the additional safety checks on the user side of things.
    declare const DEFAULT: any;
    export default DEFAULT;
}
