import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function IsBeforeDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsBeforeDate',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string | Date, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (
            args.object as Record<string, string | Date | undefined>
          )[relatedPropertyName];

          if (relatedValue === undefined || relatedValue === null) {
            return true;
          }

          const currentDate = toDate(value);
          const relatedDate = toDate(relatedValue);

          if (
            Number.isNaN(currentDate.getTime()) ||
            Number.isNaN(relatedDate.getTime())
          ) {
            return false;
          }

          return currentDate < relatedDate;
        },
      },
    });
  };
}
