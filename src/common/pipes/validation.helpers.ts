import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsEgyptianPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEgyptianPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && /^\+201[0125][0-9]{8}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'رقم الهاتف يجب أن يكون رقم هاتف مصري صحيح يبدأ بـ +20';
        },
      },
    });
  };
}

export function IsEgyptianNationalId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEgyptianNationalId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // الرقم القومي المصري يتكون من 14 رقم ويبدأ بـ 2 (لمواليد 1900-1999) أو 3 (لمواليد 2000-2099)
          return typeof value === 'string' && /^[23][0-9]{13}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'الرقم القومي المصري يجب أن يكون مكوناً من 14 رقماً ويبدأ بـ 2 أو 3';
        },
      },
    });
  };
}
