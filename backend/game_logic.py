def calculate_performance(moves, mistakes, time_taken):
    
    if moves > 0:
        accuracy = ((moves - mistakes) / moves) * 100
    else:
        accuracy = 0

   
    score = max(
        0,
        round(1000 - (mistakes * 100) - (time_taken * 5))
    )

    return {
        "accuracy": round(accuracy, 2),
        "score": score
    }