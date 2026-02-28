import React from 'react'
import {BrowserRouter,Routes,Route, Navigate} from 'react-router'
import Login from './pages/login'
import UserList from './pages/UserList'
import UserForm from './pages/UserForm'


function App() {
  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login/>}/>
        <Route path='/users' element={<UserList/>}/>
        <Route path="/users/add"      element={<UserForm />} />
        <Route path='/users/edit/:id' element={<UserForm/>}/>
        <Route path="*"               element={<Navigate to="/login" />} />
      </Routes>
      </BrowserRouter>
      
    </div>
  )
}

export default App
