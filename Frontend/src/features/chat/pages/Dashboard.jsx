import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { useChat } from '../hooks/useChat.js'
import { useAuth } from '../../auth/hook/useAuth.js'
import { disconnectSocket } from '../service/chat.socket.js'
import '../styles/chat.css'

const Dashboard = () => {

  const messageEndRef = useRef(null)
  const chat = useChat()
  const { handleLogout } = useAuth()
  const navigate = useNavigate()
  const [chatInput, setChatInput] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const chats = useSelector((state) => state.chat.chats)
  const currentChatId = useSelector((state) => state.chat.currentChatId)
  const currentChat = chats[currentChatId]

  const activeMessage = currentChat?.messages.find(m => m.isPending || m.isStreaming)
  const isGenerating = Boolean(activeMessage)

  useEffect(() => {
    chat.initializeSocketConnection()
    chat.handleGetChats()
  }, [])

  const lastContent = currentChat?.messages.at(-1)?.content

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  }, [currentChat?.messages.length, lastContent]);

  const handleSubmitMessage = (e) => {
    e.preventDefault()

    const trimmedMessage = chatInput.trim()
    if (!trimmedMessage || isGenerating) {
      return
    }

    chat.handleSendMessage({ message: trimmedMessage, chatId: currentChatId })
    setChatInput('')
  }

  const handleRemoveChat = (chatId) => {
    if (!window.confirm('Delete this conversation?')) return
    chat.handleDeleteChat(chatId)
  }

  const startRename = (chatId, currentTitle) => {
    setRenameValue(currentTitle)
    setRenamingId(chatId)
  }

  const commitRename = (chatId) => {
    const title = renameValue.trim()
    setRenamingId(null)
    if (!title || title === chats[chatId]?.title) return
    chat.handleRenameChat(chatId, title)
  }

  const startNewChat = () => {
    setRenamingId(null)
    setChatInput('')
    setIsSidebarOpen(false)
    chat.handleNewChat()
  }

  const openChat = (chatId) => {
    setIsSidebarOpen(false)
    chat.handleOpenChats(chatId, chats)
  }

  const stopGenerating = () => {
    if(activeMessage) chat.handleStopMessage(activeMessage.id)
  }

  const signOut = async () => {
    if (!window.confirm('Log out of Quantix?')) return
    try {
      await handleLogout()
      disconnectSocket()
      navigate('/login')
    }
    catch (error) {
      // auth slice already holds the error message
    }
  }

  return (
    <main className='chat-app'>
      <section className='chat-container'>
        <aside className={`chat-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true"> Q </span>
            <h1 className='chat-logo'>Quantix</h1>
            <button
              className='new-chat-button'
              onClick={startNewChat}
              type='button'
              aria-label='Start a new chat'>
              +
            </button>
          </div>
          <div className="sidebar-heading">
            <span>
              Conversations
            </span>
            <span className="chat-count">{Object.keys(chats).length}</span>
          </div>
          <div className="chat-list">
            {Object.values(chats).map((c, index) => (
              <div
                className={`chat-list-item ${currentChatId === c.id ? 'is-active' : ''}`}
                key={c.id}>
                {renamingId === c.id ? (
                  <input
                    className='chat-rename-input'
                    value={renameValue}
                    autoFocus
                    maxLength={100}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(c.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }} />
                ) : (
                  <>
                    <button
                      className={`chat-list-button`}
                      onClick={() => openChat(c.id)}
                      type='button'>
                      {c.title}
                    </button>
                    {!c.isTemp && (
                      <>

                        <button
                          className='chat-rename-button'
                          onClick={(e) => { e.stopPropagation(); startRename(c.id, c.title) }}
                          type='button'
                          aria-label={`Rename ${c.title}`}>
                          ✎
                        </button>
                        <button
                          className='chat-delete-button'
                          onClick={(e) => { e.stopPropagation(); handleRemoveChat(c.id) }}
                          type='button'
                          aria-label={`Delete ${c.title}`}>
                          x
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
            {!Object.keys(chats).length && <p className="empty-chats">Your conversations will appear here.</p>}
          </div>
          <div className="sidebar-footer">
            <button
              className='logout-button'
              onClick={signOut}
              type='button'
              aria-label='Log out'>
              <span aria-hidden="true">⏻</span><span>Log out</span>
            </button>
            <p className="sidebar-note">Answers powered by your AI workspace.</p>
          </div>
        </aside>

        {isSidebarOpen && (
          <button
            className='sidebar-backdrop'
            onClick={() => setIsSidebarOpen(false)}
            type='button'
            aria-label='Close conversations' />
        )}

        <section className='chat-main'>
          <header className="chat-header">
            <button
              className='sidebar-toggle'
              onClick={() => setIsSidebarOpen(true)}
              type='button'
              aria-label='Open conversations'>
              ☰
            </button>
            <div className="chat-header-title">
              <p className="eyebrow">AI WORKSPACE</p>
              <h2>{currentChat?.title || 'Start a new conversation'}</h2>
            </div>
          </header>
          <div className="messages">
            {!currentChat?.messages.length && <div className="welcome-state">
              <span className="welcome-orb" aria-hidden="true">✦</span>
              <p className="eyebrow">QUANTIX ASSISTANT</p>
              <h3>What would you like to explore?</h3>
              <p>Ask a question, untangle an idea, or turn a rough thought into a plan.</p>
            </div>}
            {currentChat?.messages.map((message, index) => (
              <div
                key={message.id}
                className={`message ${message.role === "User" ? "message-user" : "message-assistant"}`}>
                {message.isPending ? (
                  <div className="pending-state">
                    <span className='typing-dots'><i /><i /><i /></span>
                    {message.status && <span className='message-status'>{message.status}</span>}
                  </div>
                ) : message.role === 'User' ? (
                  <p>{message.content}</p>
                ) : (
                  <div className={`markdown-body ${message.isStreaming ? 'is-streaming' : ''}`}>

                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className='markdown-para'>{children}</p>,
                        ul: ({ children }) => <ul className='markdown-ul'>{children}</ul>,
                        ol: ({ children }) => <ol className='markdown-ol'>{children}</ol>,
                        code: ({ children }) => <code className='markdown-code'>{children}</code>,
                        pre: ({ children }) => <pre className='markdown-pre'>{children}</pre>
                      }}
                      remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                    {message.status && <span className='message-status'>{message.status}</span>}
                  </div>
                )}
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <footer className='chat-footer'>
            <form onSubmit={handleSubmitMessage} className='chat-form'>
              <input
                type='text'
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder='Message Quantix...'
                className='chat-input' />

              {isGenerating ? (
                <button type='button' onClick={stopGenerating} className='chat-send-button chat-stop-button'>
                  <span>Stop</span>
                </button>
              ) : (
                <button type='submit' disabled={!chatInput.trim()} className='chat-send-button'>
                  <span>Send</span><span aria-hidden="true"></span>
                </button>
              )}
            </form>
            <p className="input-hint">Press Enter to send</p>
          </footer>
        </section>
      </section>
    </main>
  )
}

export default Dashboard
