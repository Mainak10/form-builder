// src/registry/register.ts
import { registerField } from '@/registry'
import { singleLineRegistration } from '@/fields/SingleLineField'
import { multiLineRegistration } from '@/fields/MultiLineField'
import { numberRegistration } from '@/fields/NumberField'
import { dateRegistration } from '@/fields/DateField'
import { singleSelectRegistration } from '@/fields/SingleSelectField'
import { multiSelectRegistration } from '@/fields/MultiSelectField'
import { fileUploadRegistration } from '@/fields/FileUploadField'
import { sectionHeaderRegistration } from '@/fields/SectionHeaderField'
import { calculationRegistration } from '@/fields/CalculationField'

registerField(singleLineRegistration)
registerField(multiLineRegistration)
registerField(numberRegistration)
registerField(dateRegistration)
registerField(singleSelectRegistration)
registerField(multiSelectRegistration)
registerField(fileUploadRegistration)
registerField(sectionHeaderRegistration)
registerField(calculationRegistration)
