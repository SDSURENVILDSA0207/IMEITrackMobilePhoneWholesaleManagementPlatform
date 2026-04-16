from sqlalchemy.orm import Session


def add_and_commit(db: Session, entity):
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity
