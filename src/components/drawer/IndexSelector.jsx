import { createFilterOptions } from '@mui/material/Autocomplete';
import React, { useContext, useEffect } from "react";
import { Autocomplete, TextField } from "../../../node_modules/@mui/material/index";
import { AppContext } from "../../App";

export default () => {

    const { esStore, esIndex, setSelectedIndex } = useContext(AppContext)

    const [indexNames, setIndexNames] = React.useState([]);

    const filter = createFilterOptions();

    const loadIndexNames = async () => {
        const indices = await esStore.getIndices()
        setIndexNames(indices.map(e => { return { title: e.index } }))
    }

    useEffect(() => { loadIndexNames() }, [])

    return (
        <Autocomplete
            value={esIndex}
            onChange={(event, newValue) => {
                const indexName = newValue && (newValue.inputValue || newValue.title || newValue)
                setSelectedIndex(indexName);
            }}
            filterOptions={(options, params) => {
                const filtered = filter(options, params);

                const { inputValue } = params;
                // Suggest the creation of a new value
                const isExisting = options.some((option) => inputValue === option.title);
                if (inputValue !== '' && !isExisting) {
                    filtered.push({
                        inputValue,
                        title: `Add "${inputValue}"`,
                    });
                }

                return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={indexNames}
            getOptionLabel={(option) => {
                // Value selected with enter, right from the input
                if (typeof option === 'string') {
                    return option;
                }
                // Add "xxx" option created dynamically
                if (option.inputValue) {
                    return option.inputValue;
                }
                // Regular option
                return option.title;
            }}
            renderOption={(props, option) => <li {...props}>{option.title}</li>}
            sx={{ m: 1, mt: 2 }}
            freeSolo
            renderInput={(params) => (
                <TextField {...params} label="Index name" />
            )}
        />
    )
}