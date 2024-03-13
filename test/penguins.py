import random
import json
import os
import numpy as np


def generate_random_data():
    species_data = {
        "Adelie": {
            "MALE": {
                "Beak Length (mm)": {"min": 34.6, "max": 46},
                "Beak Depth (mm)": {"min": 17, "max": 21.5},
                "Flipper Length (mm)": {"min": 178, "max": 210},
                "Body Mass (g)": {"min": 3325, "max": 4775},
            },
            "FEMALE": {
                "Beak Length (mm)": {"min": 32.1, "max": 42.2},
                "Beak Depth (mm)": {"min": 15.5, "max": 20.7},
                "Flipper Length (mm)": {"min": 172, "max": 202},
                "Body Mass (g)": {"min": 2850, "max": 3900},
            },
        },
        "Chinstrap": {
            "MALE": {
                "Beak Length (mm)": {"min": 48.5, "max": 55.8},
                "Beak Depth (mm)": {"min": 17.5, "max": 20.8},
                "Flipper Length (mm)": {"min": 187, "max": 212},
                "Body Mass (g)": {"min": 3250, "max": 4800},
            },
            "FEMALE": {
                "Beak Length (mm)": {"min": 40.9, "max": 58},
                "Beak Depth (mm)": {"min": 16.4, "max": 19.4},
                "Flipper Length (mm)": {"min": 178, "max": 202},
                "Body Mass (g)": {"min": 2700, "max": 4150},
            },
        },
        "Gentoo": {
            "MALE": {
                "Beak Length (mm)": {"min": 44.4, "max": 59.6},
                "Beak Depth (mm)": {"min": 14.1, "max": 17.3},
                "Flipper Length (mm)": {"min": 208, "max": 231},
                "Body Mass (g)": {"min": 4750, "max": 6300},
            },
            "FEMALE": {
                "Beak Length (mm)": {"min": 40.9, "max": 50.5},
                "Beak Depth (mm)": {"min": 13.1, "max": 15.5},
                "Flipper Length (mm)": {"min": 203, "max": 222},
                "Body Mass (g)": {"min": 3950, "max": 5200},
            },
        },
    }

    data = []

    for _ in range(50000):
        species = random.choice(list(species_data.keys()))
        sex = random.choice(["MALE", "FEMALE"])

        values = species_data[species][sex]

        record = {
            "Species": species,
            "Island": random.choice(["Torgersen", "Biscoe", "Dream"]),
            "Beak Length (mm)": round(
                np.random.triangular(
                    values.get("Beak Length (mm)", {}).get("min", 0),
                    (values.get("Beak Length (mm)", {}).get("min", 0) +
                     values.get("Beak Length (mm)", {}).get("max", 0)) / 2,
                    values.get("Beak Length (mm)", {}).get("max", 0),
                ),
                1,
            ),
            "Beak Depth (mm)": round(
                np.random.triangular(
                    values.get("Beak Depth (mm)", {}).get("min", 0),
                    (values.get("Beak Depth (mm)", {}).get("min", 0) +
                     values.get("Beak Depth (mm)", {}).get("max", 0)) / 2,
                    values.get("Beak Depth (mm)", {}).get("max", 0),
                ),
                1,
            ),
            "Flipper Length (mm)": round(
                np.random.triangular(
                    values.get("Flipper Length (mm)", {}).get("min", 0),
                    (values.get("Flipper Length (mm)", {}).get("min", 0) +
                     values.get("Flipper Length (mm)", {}).get("max", 0)) / 2,
                    values.get("Flipper Length (mm)", {}).get("max", 0),
                ),
                1,
            ),
            "Body Mass (g)": round(
                np.random.triangular(
                    values.get("Body Mass (g)", {}).get("min", 0),
                    (values.get("Body Mass (g)", {}).get("min", 0) +
                     values.get("Body Mass (g)", {}).get("max", 0)) / 2,
                    values.get("Body Mass (g)", {}).get("max", 0),
                ),
                1,
            ),
            "Sex": sex,
        }

        data.append(record)

    data.sort(key=lambda x: x["Species"])
    return data


if __name__ == "__main__":
    generated_data = generate_random_data()

    current_directory = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_directory, "data/penguins.json")
    with open(file_path, "w") as json_file:
        json.dump(generated_data, json_file, indent=2)
