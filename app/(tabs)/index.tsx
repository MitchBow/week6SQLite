import { deleteDatabaseAsync, SQLiteDatabase, SQLiteProvider, SQLiteStatement, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';

export default function App() {
  
  return (
    <View style={styles.container}>
      <SQLiteProvider databaseName="test.db" onInit={migrateDbIfNeeded}>
        <Header />
        <Content />
      </SQLiteProvider>
    </View>
  );
}

export function Header() {
  const db = useSQLiteContext();
  const [version, setVersion] = useState('');

  useEffect(() => {
    async function setup() {
      const result = (await db.getFirstAsync<{ 'sqlite_version()': string }>(
        'SELECT sqlite_version()'
      ))!;
      
      setVersion(result['sqlite_version()']!);
    }
    setup();
  }, []);
    return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>SQLite version: {version}</Text>
    </View>
  );
}

interface Todo {
  value: string;
  intValue: number;
}



export function Content() {
  const [name, onChangeName] = useState('Enter Name');
  const [number, onChangeNumber] = useState('1');
  const db = useSQLiteContext();
  const [todos, setTodos] = useState<Todo[]>([]);
  let t = todos; 

  useEffect(() => {
    async function setup() {
      const result = await db.getAllAsync<Todo>('SELECT * FROM todos');
      return result;
      setTodos(result);
    }
    setup();
  }, [todos]);

  async function dropdB() {
   console.log("drop db");
   await db.execAsync('DROP TABLE IF EXISTS todos;');
   //reset the ToDo hook others the view won't change.
   let rTodo = {value: "empty", intValue: 0}; 
   setTodos([rTodo]);
  }

  async function getall() {
    const result = await db.getAllAsync<Todo>('SELECT * FROM todos');
    setTodos(result);
    console.log(result);
  }

  async function createdB() {
   console.log("create db");
   await db.execAsync('PRAGMA user_version = 0;'); //tell it that the table is older.
   await migrateDbIfNeeded(db); //add the table again.
   getall();
  }

  async function alldB() { //list all tables in case you added one. And it is still there!!
    console.log("all tables"); 
    const result = await db.getAllAsync("SELECT * FROM sqlite_master");
    console.log(result);
  }

  async function insertdB() { //list all tables in case you added one. And it is still there!!
    console.log("insert ");  
    const result = await db.runAsync('INSERT INTO todos (value, intValue) VALUES (?, ?)', name, number);
    if (result.changes == 0) {
      console.log("Not foud - no changes (error)");
    } else {
      console.log("Inserted: " + result.changes + " row(s)");
    }
    getall(); //update the map
  }

  async function readdB() { //list all tables in case you added one. And it is still there!!
    console.log("read"); 
    const result = await db.getAllAsync('Select * FROM todos where value=$value', {$value:name});
    console.log(result);
    if (result.length == 0) {
      console.log("Not found");
    }
  }

  async function updatedB() { //give name update values
    console.log("update"); 
    const result = await db.runAsync('UPDATE todos SET intValue = ? WHERE value = ?', number, name)
    if (result.changes == 0) {
      console.log("Not found - no changes");
    } else {
      console.log("Updated: " + result.changes + " row(s)");
    }
    getall();
  }

  async function deletedB() { //delete if name is there
    console.log("delete"); 
    
    const result = await db.runAsync('Delete From todos where value=$value',{$value:name});
    if (result.changes == 0) {
      console.log("Not found - no changes");
    } else {
      console.log("Deleted: " + result.changes + " row(s)");
    }
    getall();
  }

  return (
    <View style={styles.contentContainer}>
      <View style={styles.buttons}>
      <Button 
        title="Drop dB" 
        onPress={()=>dropdB()}
        />
      <Button 
        title="Create and Populate dB" 
        onPress={()=>createdB()}
        />
        <Button 
        title="ALl Tables dB" 
        onPress={()=>alldB()}
        />
        </View>
      <View style={styles.textInput}>
          <TextInput
            onChangeText = {onChangeName}
            value={name}
          />
          <TextInput
            onChangeText = {onChangeNumber}
            value={number}
          />
        </View>
    
        <View style={styles.buttonsCRUD}>
        <Button 
        title="Insert" 
        onPress={()=>insertdB()}
        />
        <Button 
        title="Read" 
        onPress={()=>readdB()}
        />
        <Button 
        title="Update" 
        onPress={()=>updatedB()}
        />
        <Button 
        title="Delete" 
        onPress={()=>deletedB()}
        />
        </View>
      {todos.map((todo, todoIndex) => (
        <View style={styles.todoItemContainer} key={todoIndex}>
          <Text>{`${todo.intValue} - ${todo.value}`}</Text>
        </View>
      ))}
      </View>
  );
}

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  ))!;
  console.log(currentDbVersion);
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    console.log("creating tables and populating");
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
`);
    await db.runAsync('INSERT INTO todos (value, intValue) VALUES (?, ?)', 'hello', 11);
    await db.runAsync('INSERT INTO todos (value, intValue) VALUES (?, ?)', 'world', 22);
    await db.runAsync('INSERT INTO todos (value, intValue) VALUES (?, ?)', 'everyone', 44);
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}


const styles = StyleSheet.create({
  // Your styles
  headerContainer: {
    padding: 40
  },
  headerText: {
  
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8.
  },
  buttons: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonsCRUD: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoItemContainer: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});