Dense register table with sticky mono header; `stacked` turns rows into labelled cards on phones.
```jsx
<DataTable columns={[{key:"name",label:"System"},{key:"owner",label:"Owner"}]} rows={systems} stacked={isPhone} />
```
