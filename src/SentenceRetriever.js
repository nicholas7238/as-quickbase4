import React, {useState, useEffect} from 'react'

const IS_DATABASE_ASCII = true

const TABLE = {
    VOCABULARY: {
        NAME: 'vocabulary',
        ID: 'brrcdgyix',
        FIELDS: {
            // id: 3,
            wordIdiom: 6,
            use: 7,
            partOfSpeech: 8,
            frequencyRank: 14,
            vocabName: 17
        }
    },
    EXAMPLES: {
        NAME: 'examples',
        ID: 'brrcdgyjw',
        FIELDS: {
            // id: 3,
            spanishExample: 6,
            englishTranslation: 7,
            vocabIncluded: 15,
            spanglish: 13
        }
    },
    LESSONS: {
        NAME: 'lessons',
        ID: 'brrtcungb',
        FIELDS: {
            lesson: 6,
            vocabIncluded: 11
        }
    },
    VOCABULARY_EXAMPLES: 'brrcdgykk'
}

export default function SentenceRetriever() {
    const [userToken, setUserToken] = useState('')

    const [vocabTable, setVocabTable] = useState([])
    const [examplesTable, setExamplesTable] = useState([])
    const [lessonsTable, setLessonsTable] = useState([])

    const [allSuggestedVocabList, setAllSuggestedVocabList] = useState([]) // total suggested vocab list
    const [searchTerm, setSearchTerm] = useState('') // for string in search bar that changes the vocab list on every change

    const [targetVocabList, setTargetVocabList] = useState([]) // list of all the strings that will be queries from the examples table (the custom vocab search list)
    const [vocabIncludedSearchList, setVocabIncludedSearchList] = useState([]) // this will be the one that actually gets searched
    const [noSpanglish, setNoSpanglish] = useState(false)

    const [exampleList, setExampleList] = useState([]) // example list to be displayed in the table at bottom
    const [whereClause, setWhereClause] = useState('')

    // new function
    function createLocalTable(tableName, jsonData) {
        let newArr
        switch(tableName) {
            
            case TABLE.VOCABULARY.NAME:
                newArr = jsonData.data.map(row => {
                    return {
                        name: row[TABLE.VOCABULARY.FIELDS.vocabName].value,
                        partOfSpeech: row[TABLE.VOCABULARY.FIELDS.partOfSpeech].value,
                        frequencyRank: row[TABLE.VOCABULARY.FIELDS.frequencyRank].value
                    }
                })       
                setVocabTable(newArr)
                return
            case TABLE.EXAMPLES.NAME:
                newArr = jsonData.data.map(row => {
                    return {
                        spanish: row[TABLE.EXAMPLES.FIELDS.spanishExample].value,
                        english: row[TABLE.EXAMPLES.FIELDS.englishTranslation].value,
                        vocabIncluded: row[TABLE.EXAMPLES.FIELDS.vocabIncluded].value,
                        spanglish: row[TABLE.EXAMPLES.FIELDS.spanglish].value
                    }
                })
                setExamplesTable(newArr)
                return
                //setExampleList(examplesTable)
            case TABLE.LESSONS.NAME:
                newArr = jsonData.data.map(row => {
                    return {
                        lesson: row[TABLE.LESSONS.FIELDS.lesson].value,
                        vocabIncluded: row[TABLE.LESSONS.FIELDS.vocabIncluded].value
                    }
                })
                //console.log('lesson arr')
                //console.log(newArr)
                setLessonsTable(newArr)
            default:
                //
        }
    }

    function createHeaders() {
        const headers = {
            'QB-Realm-Hostname': 'masterofmemory.quickbase.com',
            'User-Agent': 'NickApp',
            'Authorization': userToken,
            'Content-Type': 'application/json'
        }
        return headers
    }

    //combined version of vocab & exmpales
    function createBody2(tableName) {
        let body
        switch(tableName) {
            case TABLE.VOCABULARY.NAME:
                body = {
                    "from": TABLE.VOCABULARY.ID,
                    "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
                }
                return body
            case TABLE.EXAMPLES.NAME:
                body = {
                    "from": TABLE.EXAMPLES.ID,
                    "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
                    //"where": whereClause
                }
                return body
            case TABLE.LESSONS.NAME:
                body = {
                    "from": TABLE.LESSONS.ID,
                    "select": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
                }
                return body
            default:
                //
        }
    }

    function getFilteredResults() { // for vocab
        //return allSuggestedVocabList.filter(vocabObject => vocabObject.name.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        return vocabTable.filter(vocabObject => vocabObject.name.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    }

    function getFilteredExamples() {
        const listToFilterBy = vocabIncludedSearchList
        if(listToFilterBy.length != 0) {
            const newList = examplesTable.filter(exampleObject => {
                for(const vocab of listToFilterBy) {
                    // checks if tagged words contatin search word
                    for(const element of exampleObject.vocabIncluded) {
                        if(element.toLowerCase().includes(vocab.name.toLowerCase())) {
                            return true
                        }
                    }
                }
                return false
            })
            //const newList2 = noSpanglish ? newList.filter(exampleObject => {return exampleObject.spanglish !== null ? exampleObject.spanglish === 'esp' : false }) : newList
            const newList2 = noSpanglish ? newList.filter(exampleObject => exampleObject.spanglish === 'esp') : newList
            //console.log(newList2)
            setExampleList(newList2)
        } else {
            const newList =  noSpanglish ? examplesTable.filter(exampleObject => exampleObject.spanglish === 'esp') : examplesTable
            setExampleList(newList)
        }
    }

    function addToTargetVocabList(e, term) {
        e.preventDefault()
        setTargetVocabList([...targetVocabList, { id: Date.now(), name: term}])
        //
        //console.log("filtered-----------------")
        //getFilteredExamples()
    }
    function removeFromTargetVocabList(id) {
        setTargetVocabList(targetVocabList.filter(term => term.id !== id))
    }

    // the newest & current version
    function fetchTableFromQuickbase(tableName) {
        fetch('https://api.quickbase.com/v1/records/query',
            {
            method: 'POST',
            headers: createHeaders(),
            body: JSON.stringify(createBody2(tableName))
            })
        .then(res => {
            if (res.ok) {
                if(IS_DATABASE_ASCII) {
                    return res.arrayBuffer().then(buffer => {
                        const decoder = new TextDecoder('ASCII')
                        const text = decoder.decode(buffer)
                        console.log(tableName)
                        console.log('text decoder')
                        console.log(text)
            
                        const json = JSON.parse(text)
            
                        console.log('json')
                        console.log(json)

                        createLocalTable(tableName, json)
            
                    })
                }
            return res.json().then(res => createLocalTable(tableName, res));
            }
            return res.json().then(resBody => Promise.reject({status: res.status, ...resBody}));
        })
        
        .catch(err => console.log(err))

    }



    function shuffleExampleList() {        
        const shuffledList = [...exampleList]

        for(let i = shuffledList.length; i > 0; i--) {
            const newIndex = Math.floor(Math.random() * (i - 1))
            const oldValue = shuffledList[newIndex]
            shuffledList[newIndex] = shuffledList[i - 1]
            shuffledList[i - 1] = oldValue
        }

        setExampleList(shuffledList)
    }

    function copySentences() {
        const englishSentences = exampleList.map(example => {
            return example.english
        }).join('\n')
        const spanishSentences = exampleList.map(example => {
            return example.spanish
        }).join('\n')
        //
        const copiedText = englishSentences + '\n\n' + spanishSentences

        //console.log(englishSentences)
        navigator.clipboard.writeText(copiedText)
    }

    function handleOnChangeNoSpanglish(e) {
        e.preventDefault()

    }
/*
    useEffect(() => {
        fetchTableFromQuickbase(TABLE.VOCABULARY.NAME)
        fetchTableFromQuickbase(TABLE.EXAMPLES.NAME)
        //console.log('fetching from lessons')
        
        setExampleList(examplesTable)

        fetchTableFromQuickbase(TABLE.LESSONS.NAME)
        console.log(lessonsTable)
    }, [])
*/
    useEffect(() => {
        getFilteredExamples()
    }, [noSpanglish, vocabIncludedSearchList])

    useEffect(() => {
        console.log('user token is now: ' + userToken)

        fetchTableFromQuickbase(TABLE.VOCABULARY.NAME)
        fetchTableFromQuickbase(TABLE.EXAMPLES.NAME)
        //console.log('fetching from lessons')
        
        setExampleList(examplesTable)

        fetchTableFromQuickbase(TABLE.LESSONS.NAME)
        console.log(lessonsTable)

    }, [userToken])

    return (
        <div>
            <form onSubmit={(e) => {
                e.preventDefault()
                setUserToken(e.target[0].value)
                }} >
                <input type='text'></input>
            </form>
            <h1>Sentence Lookup</h1>
            <table>
                <tr>
                    <td className='suggestions'>
                        <form onSubmit={(e) => {
                            addToTargetVocabList(e, searchTerm)
                            setSearchTerm('')
                        }}>
                            <input className='suggestions-searchbar' type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}></input>
                            <button>Add to search query &gt;&gt;</button>
                        </form>
                        <ul className='suggestions-content'>
                            {getFilteredResults().map(vocab => {
                                return (<li key={vocab.id} onClick={(e) => addToTargetVocabList(e, vocab.name)}>{vocab.name}</li>)
                            })}
                        </ul>
                    </td>
                    <td className='chosen-vocab'>
                        {/** <button onClick={getFilteredExamples}>Retrieve Sentences</button> */}
                        <button onClick={() => setVocabIncludedSearchList(targetVocabList)}>Retrieve Sentences</button>
                        
                        
                        <div>
                            {targetVocabList.map(term => {
                                return (<button className='chosen-vocab-term' key={term.id} onClick={()=>removeFromTargetVocabList(term.id)}>[{term.name}] </button>)
                            })}
                        </div>

                        <br />
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            console.log(e.target[0].value)
                            const lessonObj = lessonsTable.find(element => element.lesson === e.target[0].value)
                            console.log(lessonObj.vocabIncluded)
                            const newArr = lessonObj.vocabIncluded.map((element, id) => {return ( { id: id, name: element })})
                            setVocabIncludedSearchList(newArr)
                            
                        }}>
                            
                            <select name='lessonSelect'>
                                {lessonsTable.map(lesson => {
                                    return(<option value={lesson.lesson}>{lesson.lesson}</option>)
                                })}
                                
                            </select>
                            
                            <input type='submit' value='Retrieve by Lesson'></input>
                        </form>
                    </td>
                    
                </tr>
            </table>


            
            <button onClick={shuffleExampleList}>Shuffle Sentences</button>
            <button onClick={copySentences}>Copy Sentences</button>
            
            <input type='checkbox' onChange={(e) => {
                setNoSpanglish(e.target.checked)
                //getFilteredExamples()
            } } name='spanglishCheckbox' ></input><label for='spanglishCheckbox'>No Spanglish?</label>
            
            <label style={{textAlign: 'right', display: 'block'}}>Number of results: {exampleList.length}  </label>

            <table className='sentence-table'>
                <tr>
                    <th>Spanish</th>
                    <th>English</th>
                    <th>Vocab/Idioms</th>
                </tr>
                {exampleList.map(exampleObject => {
                    return (<tr key={exampleObject.id}>
                        <td>{exampleObject.id} {exampleObject.spanish}</td>
                        <td>{exampleObject.english}</td>
                        <td>{exampleObject.vocabIncluded.map(vocab => {
                            return(<button className='vocab-included-button' >{vocab}</button>)
                        })}</td>
                    </tr>)
                })}
            </table>

        </div>
    )
}
