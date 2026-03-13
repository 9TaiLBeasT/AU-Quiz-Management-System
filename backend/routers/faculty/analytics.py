from fastapi import APIRouter, Depends, HTTPException
from core.deps import require_faculty
from db.supabase_client import get_admin_client

router = APIRouter()


@router.get("/quizzes/{quiz_id}/analytics")
def get_quiz_analytics(quiz_id: str, user=Depends(require_faculty)):
    client = get_admin_client()

    # Verify ownership
    quiz = client.table("quizzes").select("*").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")

    attempts = client.table("quiz_attempts").select("*").eq("quiz_id", quiz_id).execute().data or []
    questions = client.table("quiz_questions").select("*").eq("quiz_id", quiz_id).execute().data or []

    if not attempts:
        return {
            "quiz_id": quiz_id,
            "quiz_title": quiz.data.get("difficulty_level", "Quiz"),
            "total_attempts": 0,
            "avg_score": 0,
            "highest_score": 0,
            "lowest_score": 0,
            "question_accuracies": [],
            "weak_topics": [],
        }

    total = len(attempts)
    pcts = [a["score"] / a["total_questions"] * 100 for a in attempts if a.get("total_questions")]
    avg = round(sum(pcts) / len(pcts), 1) if pcts else 0
    highest = round(max(pcts), 1) if pcts else 0
    lowest = round(min(pcts), 1) if pcts else 0

    # Per-question accuracy
    question_accuracies = []
    weak_topics = []
    for i, q in enumerate(questions):
        correct_count = sum(
            1 for a in attempts
            if isinstance(a.get("answers"), dict) and a["answers"].get(q["id"]) == q["correct_option"]
        )
        acc = round(correct_count / total * 100, 1) if total else 0
        question_accuracies.append({
            "label": f"Q{i + 1}",
            "accuracy": acc,
            "question_text": q["question_text"][:60] + "..." if len(q["question_text"]) > 60 else q["question_text"],
        })
        if acc < 50:
            weak_topics.append({
                "question_number": i + 1,
                "question_text": q["question_text"],
                "accuracy": acc,
            })

    return {
        "quiz_id": quiz_id,
        "quiz_title": f"{quiz.data['difficulty_level'].title()} — {quiz.data.get('subject_id', 'Quiz')}",
        "total_attempts": total,
        "avg_score": avg,
        "highest_score": highest,
        "lowest_score": lowest,
        "question_accuracies": question_accuracies,
        "weak_topics": weak_topics,
    }


# ─────────────────────────────────────────────────
@router.delete("/quizzes/{quiz_id}/attempts/{attempt_id}", status_code=204)
def delete_attempt(quiz_id: str, attempt_id: str, user=Depends(require_faculty)):
    client = get_admin_client()
    # Verify faculty owns the quiz before allowing deletion
    quiz = client.table("quizzes").select("id").eq("id", quiz_id).eq("faculty_id", user["id"]).maybe_single().execute()
    if not quiz.data:
        raise HTTPException(404, "Quiz not found or access denied")

    client.table("quiz_attempts").delete().eq("id", attempt_id).eq("quiz_id", quiz_id).execute()
