# backend/database.py
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./alchemy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

Base = declarative_base()

class Pigment(Base):
    __tablename__ = "pigments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    pigment_index = Column(String)
    k_values = Column(String)
    s_values = Column(String)

class Glaze(Base):
    __tablename__ = "glazes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    silica = Column(Float)
    alumina = Column(Float)
    flux = Column(Float)
    colorant = Column(String)
    base_color_hex = Column(String)

class ClayBody(Base):
    __tablename__ = "clay_bodies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    clay_type = Column(String)
    firing_range_min = Column(Integer)
    firing_range_max = Column(Integer)

class SculptureMaterial(Base):
    __tablename__ = "sculpture_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    density = Column(Float)
    yield_strength = Column(Float)
    compressive_strength = Column(Float)

Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()