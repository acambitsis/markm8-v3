// Grade output schema for AI SDK
// Derives from Convex validators (single source of truth)
// Converts to JSON Schema for AI SDK 6 compatibility

import { jsonSchema } from 'ai';
import type { Infer, Validator } from 'convex/values';
import { v } from 'convex/values';
// =============================================================================
// Convex Validator → JSON Schema Converter
// =============================================================================
import type { JSONSchema7 } from 'json-schema';

import { categoryScoresValidator, feedbackValidator } from '../schema';

type JSONSchema = JSONSchema7;

type ConvexValidatorJSON =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'null' }
  | { type: 'any' }
  | { type: 'array'; value: ConvexValidatorJSON }
  | {
    type: 'object';
    value: Record<
      string,
      { fieldType: ConvexValidatorJSON; optional: boolean }
    >;
  }
  | { type: 'union'; value: ConvexValidatorJSON[] }
  | { type: 'literal'; value: unknown };

/**
 * Convert Convex validator JSON format to standard JSON Schema
 * Convex uses { type: "object", value: { field: { fieldType: ..., optional: ... } } }
 * JSON Schema uses { type: "object", properties: { field: ... }, required: [...] }
 */
function convexToJsonSchema(convexJson: ConvexValidatorJSON): JSONSchema {
  switch (convexJson.type) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'null':
      return { type: 'null' };

    case 'any':
      return { type: 'object' }; // Fallback to object for any type

    case 'array':
      return {
        type: 'array',
        items: convexToJsonSchema(convexJson.value),
      };

    case 'object': {
      const properties: Record<string, JSONSchema> = {};
      const required: string[] = [];

      for (const [key, field] of Object.entries(convexJson.value)) {
        properties[key] = convexToJsonSchema(field.fieldType);
        if (!field.optional) {
          required.push(key);
        }
      }

      const result: JSONSchema = {
        type: 'object',
        properties,
      };
      if (required.length > 0) {
        result.required = required;
      }
      return result;
    }

    case 'union': {
      // For unions, we'd need oneOf/anyOf - simplified for now
      // Most grade output unions are optional fields handled above
      const firstMember = convexJson.value[0];
      if (!firstMember) {
        return { type: 'object' }; // Fallback for empty union (shouldn't happen)
      }
      return convexToJsonSchema(firstMember);
    }

    case 'literal': {
      const valueType = typeof convexJson.value;
      const schemaType = valueType === 'string'
        ? 'string'
        : valueType === 'number'
          ? 'number'
          : valueType === 'boolean'
            ? 'boolean'
            : 'string';
      return { type: schemaType, const: convexJson.value as string | number | boolean };
    }

    default:
      return { type: 'object' };
  }
}

/**
 * Convert a Convex validator to JSON Schema format for AI SDK
 */
function validatorToJsonSchema<T extends Validator<unknown, 'required', string>>(
  validator: T,
): JSONSchema {
  // Access the internal JSON representation of the Convex validator
  // This is a documented API as of Convex 1.13+
  const convexJson = (validator as unknown as { json: ConvexValidatorJSON }).json;
  return convexToJsonSchema(convexJson);
}

// =============================================================================
// Grade Output Schema
// =============================================================================

// Build the grade output validator from Convex validators
// This combines the feedback and category scores validators
// with a percentage field for the overall grade
const gradeOutputValidator = v.object({
  percentage: v.number(),
  feedback: feedbackValidator,
  categoryScores: categoryScoresValidator,
});

// Export TypeScript type from Convex validator
export type GradeOutput = Infer<typeof gradeOutputValidator>;

// Convert to JSON Schema for AI SDK
// AI SDK 6's jsonSchema() helper wraps raw JSON Schema for generateObject()
export const gradeOutputSchema = jsonSchema<GradeOutput>(
  validatorToJsonSchema(gradeOutputValidator),
);
