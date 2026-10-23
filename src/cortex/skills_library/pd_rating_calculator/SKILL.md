---
name: pd_rating_calculator
description: Calculates WPI to PD ratings using 2005 PDRS logic, age adjustments, and occupational variants.
version: 1.0.0
author: Sovereign Alpha
---

### INSTRUCTIONS
1. **Analyze Input**: Receive Body Part, WPI, Occupation, and Age at DOI.
2. **Lookup Group**: Query `occupations.md` to find the 3-digit Occupational Group Number.
3. **Lookup Variant**: Use `variants_and_logic.md` to find the Occupational Variant (C-J) for the specified Body Part Category.
4. **Apply Multiplication (FEC)**: Apply the standard 1.4 multiplier to the WPI (e.g., 10% WPI * 1.4 = 14% Base PD).
5. **Adjust for Age**: Apply the adjustment points from the Age Table in `variants_and_logic.md`.
6. **Generate Rating String**: Construct the final string in the following format:
   `[CODE] - [WPI]% - [[FEC]]% - [OccupationalVariant] - [AgeAdjustment]% - [FinalPD]%`
   *Example: 15.01.01.00 - 10 - [1.4]14 - 480H - 18 - 19%*

### ARGS
- bodyPart: The injured body part (e.g., "L-Spine", "R Shoulder").
- wpi: The Whole Person Impairment from medical reports.
- occupation: The client's job title at time of injury.
- ageAtDOI: The client's age on the Date of Injury.

### OUTPUT
Return a structured JSON including the `ratingString`, `finalPercentage`, and `worksheetReasoning`.
