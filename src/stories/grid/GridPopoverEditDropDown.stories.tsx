import "@linzjs/lui/dist/scss/base.scss";
import "@linzjs/lui/dist/fonts";
import "../../styles/index.scss";
import "../../styles/GridTheme.scss";

import { ComponentMeta, ComponentStory } from "@storybook/react/dist/ts3.9/client/preview/types-6-3";
import { GridUpdatingContextProvider } from "../../contexts/GridUpdatingContextProvider";
import { GridContextProvider } from "../../contexts/GridContextProvider";
import { Grid, GridProps } from "../../components/Grid";
import { useCallback, useMemo, useState } from "react";
import { MenuHeaderItem, MenuSeparator, MenuSeparatorString } from "../../components/gridForm/GridFormDropDown";
import { wait } from "../../utils/util";
import { ColDefT, GridCell } from "../../components/GridCell";
import { GridPopoverEditDropDown } from "../../components/gridPopoverEdit/GridPopoverEditDropDown";
import { GridFormSubComponentTextInput } from "../../components/gridForm/GridFormSubComponentTextInput";
import { GridPopoverMenu } from "../../components/gridPopoverEdit/GridPopoverMenu";
import { GridFormSubComponentTextArea } from "../../components/gridForm/GridFormSubComponentTextArea";

export default {
  title: "Components / Grids",
  component: Grid,
  args: {
    quickFilterValue: "",
    selectable: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1024, height: 400 }}>
        <GridUpdatingContextProvider>
          <GridContextProvider>
            <Story />
          </GridContextProvider>
        </GridUpdatingContextProvider>
      </div>
    ),
  ],
} as ComponentMeta<typeof Grid>;

interface ITestRow {
  id: number;
  position: string | null;
  position2: string | null;
  position3: string | null;
  position4: ICode | null;
  code: string | null;
  sub: string | null;
}

interface ICode {
  code: string;
  desc: string;
}

const GridEditDropDownTemplate: ComponentStory<typeof Grid> = (props: GridProps) => {
  const [externalSelectedItems, setExternalSelectedItems] = useState<any[]>([]);

  const optionsFn = useCallback(async (selectedRows: ITestRow[], filter?: string) => {
    // eslint-disable-next-line no-console
    console.log("optionsFn selected rows", selectedRows, filter);
    filter = filter?.toLowerCase();
    await wait(1000);
    return [
      null,
      "Architect",
      "Developer",
      "Product Owner",
      "Scrum Master",
      "Tester",
      MenuSeparatorString,
      "Custom",
    ].filter((v) => (filter != null ? v != null && v.toLowerCase().indexOf(filter) === 0 : true));
  }, []);

  const optionsObjects = useMemo(
    () => [
      { code: "O1", desc: "Object One" },
      { code: "O2", desc: "Object Two" },
    ],
    [],
  );

  const columnDefs: ColDefT<ITestRow>[] = useMemo(
    () => [
      GridCell({
        field: "id",
        headerName: "Id",
        initialWidth: 65,
        maxWidth: 85,
      }),
      GridPopoverEditDropDown(
        {
          field: "position2",
          maxWidth: 100,
          headerName: "Multi-edit",
        },
        {
          multiEdit: true,
          editorParams: {
            options: [
              MenuHeaderItem("Header"),
              {
                value: "1",
                label: "One",
                disabled: "Disabled for test",
              },
              { value: "2", label: "Two" },
              MenuSeparator,
              { value: "3", label: "Three" },
            ],
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "position3",
          initialWidth: 65,
          maxWidth: 150,
          headerName: "Custom callback",
        },
        {
          multiEdit: true,
          editorParams: {
            options: [null, "Architect", "Developer", "Product Owner", "Scrum Master", "Tester"],
            onSelectedItem: async (selected) => {
              await wait(2000);
              selected.selectedRows.forEach((row) => {
                row.position3 = selected.value;
              });
            },
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "position",
          initialWidth: 65,
          maxWidth: 150,
          headerName: "Options Fn",
        },
        {
          multiEdit: false,
          editorParams: {
            filtered: "reload",
            filterPlaceholder: "Search me...",
            options: optionsFn,
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "position3",
          initialWidth: 65,
          maxWidth: 150,
          headerName: "Filtered",
        },
        {
          multiEdit: true,
          editorParams: {
            filtered: "local",
            filterPlaceholder: "Filter this",
            options: [null, "Architect", "Developer", "Product Owner", "Scrum Master", "Tester"],
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "position4",
          initialWidth: 65,
          maxWidth: 150,
          headerName: "Filtered (object)",
          valueGetter: (params) => params.data.position4?.desc,
        },
        {
          multiEdit: true,
          editorParams: {
            filtered: "local",
            filterPlaceholder: "Filter this",
            options: optionsObjects.map((o) => {
              return { value: o, label: o.desc, disabled: false };
            }),
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "code",
          initialWidth: 65,
          maxWidth: 150,
          headerName: "Filter Selectable",
        },
        {
          multiEdit: true,
          editorParams: {
            filtered: "local",
            filterPlaceholder: "Filter this",
            filterHelpText: "Press enter to save custom value",
            options: optionsObjects.map((o) => {
              return { value: o, label: o.desc, disabled: false };
            }),
            onSelectedItem: async (selected) => {
              // eslint-disable-next-line no-console
              console.log("onSelectedItem selected", selected);
              selected.selectedRows.forEach((row) => (row.code = selected.value.code));
            },
            onSelectFilter: async (selected) => {
              // eslint-disable-next-line no-console
              console.log("onSelectFilter selected", selected);
              selected.selectedRows.forEach((row) => (row.code = selected.value));
            },
          },
        },
      ),
      GridPopoverEditDropDown(
        {
          field: "sub",
          initialWidth: 65,
          maxWidth: 150,
          headerName: "Subcomponent",
          valueGetter: (params) => params.data.sub,
        },
        {
          multiEdit: true,
          editorParams: {
            filtered: "local",
            filterPlaceholder: "Filter this",
            options: () => {
              return [
                {
                  value: "one",
                  label: "One",
                },
                {
                  value: "two",
                  label: "Two",
                },
                {
                  value: "oth",
                  label: "Other text input",
                  subComponent: () => (
                    <GridFormSubComponentTextInput placeholder={"Other..."} defaultValue={"a"} required={true} />
                  ),
                },
                {
                  value: "oth",
                  label: "Other text area",
                  subComponent: () => (
                    <GridFormSubComponentTextArea placeholder={"Other..."} defaultValue={"b"} required={true} />
                  ),
                },
              ];
            },
            onSelectedItem: async (selected) => {
              // eslint-disable-next-line no-console
              console.log("onSelectedItem", selected);
              await wait(500);
              selected.selectedRows.forEach((row) => (row.sub = selected.subComponentValue ?? selected.value));
            },
          },
        },
      ),
      GridPopoverMenu(
        {},
        {
          editorParams: {
            options: async () => [{ label: "Hello", action: async () => {} }],
          },
        },
      ),
    ],
    [optionsFn, optionsObjects],
  );

  const [rowData] = useState([
    {
      id: 1000,
      position: "Tester",
      position2: "1",
      position3: "Tester",
      position4: { code: "O1", desc: "Object One" },
      code: "O1",
      sub: "two",
    },
    {
      id: 1001,
      position: "Developer",
      position2: "2",
      position3: "Developer",
      position4: { code: "O2", desc: "Object Two" },
      code: "O2",
      sub: "one",
    },
  ] as ITestRow[]);

  return (
    <Grid
      {...props}
      externalSelectedItems={externalSelectedItems}
      setExternalSelectedItems={setExternalSelectedItems}
      columnDefs={columnDefs}
      rowData={rowData}
      domLayout={"autoHeight"}
    />
  );
};

export const EditDropdown = GridEditDropDownTemplate.bind({});
