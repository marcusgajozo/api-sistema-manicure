import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsBeforeTime(
  property: string,
  validationOptions?: ValidationOptions,
) {
  const toMinutes = (time: unknown): number | null => {
    if (typeof time !== 'string') {
      return null;
    }

    const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);

    if (!match) {
      return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  };

  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isBeforeTime',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, string>)[
            relatedPropertyName
          ];

          const currentMinutes = toMinutes(value);
          const relatedMinutes = toMinutes(relatedValue);

          if (relatedValue === undefined) {
            return true;
          }

          if (currentMinutes === null || relatedMinutes === null) {
            return false;
          }

          return currentMinutes < relatedMinutes;
        },
      },
    });
  };
}
