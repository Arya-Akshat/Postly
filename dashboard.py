import streamlit as st
import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

# Load env variables to get DATABASE_URL
load_dotenv()
db_url = os.getenv("DATABASE_URL")

st.set_page_config(page_title="Postly Dashboard", page_icon="🚀", layout="wide")

# Sidebar
st.sidebar.title("🚀 Postly Monitor")
st.sidebar.markdown("""
### How it works:
1. **Intake:** User messages Telegram bot.
2. **AI Gen:** Groq writes tailored content.
3. **Queue:** BullMQ stores jobs in Redis.
4. **Worker:** Process consumes jobs & mock-publishes.
""")
st.sidebar.info("Since real social APIs are omitted, all posts are safely mock-published.")

st.title("Postly AI Engine Dashboard")
st.markdown("Real-time monitoring of your social media queue and AI generation pipeline.")

if not db_url:
    st.error("DATABASE_URL not found in .env file.")
    st.stop()

# Connect to Database
@st.cache_resource(ttl=5) # Refresh connection cache slightly
def init_connection():
    return psycopg2.connect(db_url)

try:
    conn = init_connection()
    
    # Fetch Stats
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM users;')
        total_users = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM posts;')
        total_posts = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM platform_posts WHERE status = \'PUBLISHED\';')
        total_published = cur.fetchone()[0]
        
    col1, col2, col3 = st.columns(3)
    col1.metric("Registered Telegram Users", total_users)
    col2.metric("Total AI Ideas Generated", total_posts)
    col3.metric("Total Mock-Published", total_published)
    
    st.divider()
    
    # Recent Posts
    st.subheader("📝 Recent AI Idea Submissions")
    query = """
        SELECT 
            p.created_at as "Date",
            u.name as "User",
            p.idea as "Original Idea",
            p.tone as "Tone",
            p.model_used as "AI Engine"
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 5;
    """
    df_posts = pd.read_sql(query, conn)
    st.dataframe(df_posts, use_container_width=True, hide_index=True)

    # Queue Status
    st.subheader("⚙️ Multi-Platform Queue Status")
    queue_query = """
        SELECT 
            p.created_at as "Date",
            pp.platform as "Platform Target",
            pp.status as "Status",
            pp.content as "AI Generated Content"
        FROM platform_posts pp
        JOIN posts p ON pp.post_id = p.id
        ORDER BY p.created_at DESC LIMIT 15;
    """
    df_queue = pd.read_sql(queue_query, conn)
    
    # Render with basic visual mapping
    if not df_queue.empty:
        st.dataframe(df_queue, use_container_width=True, hide_index=True)
    else:
        st.info("No platforms posts have been generated yet. Chat with your bot to create one!")

    # Admin actions
    st.divider()
    st.subheader("🛠️ Admin Actions")
    col_a, col_b = st.columns(2)
    
    if col_a.button("Refresh Data 🔄"):
        st.rerun()

    if col_b.button("🗑️ Delete All Data", type="primary"):
        import requests
        try:
            response = requests.post("http://localhost:3000/api/admin/clear-all")
            if response.status_code == 200:
                st.success("All data cleared successfully!")
                st.rerun()
            else:
                st.error(f"Failed to clear data: {response.text}")
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")

except Exception as e:
    st.error(f"Failed to connect to database: {e}")
    st.info("Make sure your PostgreSQL docker container is running.")
