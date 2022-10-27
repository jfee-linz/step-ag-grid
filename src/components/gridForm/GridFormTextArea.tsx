import { useCallback, useState } from "react";
import { GenericCellEditorParams, GridFormProps } from "../GridCell";
import { TextAreaInput } from "../../lui/TextAreaInput";
import { useGridPopoverHook } from "../GridPopoverHook";
import { GridBaseRow } from "../Grid";

export interface GridFormTextAreaProps<RowType extends GridBaseRow> extends GenericCellEditorParams<RowType> {
  placeholder?: string;
  required?: boolean;
  maxlength?: number;
  width?: string | number;
  validate?: (value: string) => string | null;
  onSave?: (selectedRows: RowType[], value: string) => Promise<boolean>;
}

export const GridFormTextArea = <RowType extends GridBaseRow>(props: GridFormProps<RowType>) => {
  const formProps = props.formProps as GridFormTextAreaProps<RowType>;
  const [value, setValue] = useState(props.value ?? "");

  const invalid = useCallback(() => {
    if (formProps.required && value.length == 0) {
      return `Some text is required`;
    }
    if (formProps.maxlength && value.length > formProps.maxlength) {
      return `Text must be no longer than ${formProps.maxlength} characters`;
    }
    if (formProps.validate) {
      return formProps.validate(value);
    }
    return null;
  }, [formProps.maxlength, formProps.required, value.length]);

  const save = useCallback(
    async (selectedRows: any[]): Promise<boolean> => {
      if (invalid()) return false;

      if (props.value === (value ?? "")) return true;

      if (formProps.onSave) {
        return await formProps.onSave(selectedRows, value);
      }

      const field = props.field;
      if (field == null) {
        console.error("ColDef has no field set");
        return false;
      }
      selectedRows.forEach((row) => (row[field] = value));
      return true;
    },
    [formProps, invalid, props.field, props.value, value],
  );
  const { popoverWrapper } = useGridPopoverHook(props, save);

  return popoverWrapper(
    <div style={{ display: "flex", flexDirection: "row", width: formProps.width ?? 240 }} className={"FormTest"}>
      <TextAreaInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={invalid()}
        inputProps={{ placeholder: formProps.placeholder }}
      />
    </div>,
  );
};
