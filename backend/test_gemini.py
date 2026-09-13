from app.services import gemini

print("Gemini file location:")
print(gemini.__file__)
print()

text = """
Artificial Intelligence is the simulation of human intelligence.
"""

summary = gemini.summarize_text(text)

print(summary)